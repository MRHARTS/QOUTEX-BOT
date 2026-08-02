/**
Pure Node.js Quotex signal generator using Playwright to intercept websocket frames.
- Strategy: SMA(short) / SMA(long) crossover + ATR filter.
- First run: interactive login; storageState.json is saved for later runs.
Environment variables (.env):
  QUOTEX_URL=https://quotex.com    (or your regional domain)
  STORAGE_STATE=storageState.json
  SHORT_SMA=7
  LONG_SMA=21
  ATR_PERIOD=14
  ATR_THRESHOLD_PCT=0.01   (ATR / price must be < this)
  TELEGRAM_BOT_TOKEN (optional)
  TELEGRAM_CHAT_ID (optional)
  HEADLESS=false
  DEBUG_WS=false
  ALLOWED_ASSETS= (comma separated list, optional)
  SIGNALS_STATE=signals_state.json
Install:
  npm init -y
  npm i playwright technicalindicators dotenv node-fetch
  npx playwright install chromium
Run:
  node qoutex_bot.js
*/
require('dotenv').config();
const fs = require('fs');
const { chromium } = require('playwright');
const { SMA, ATR } = require('technicalindicators');
const fetch = require('node-fetch');

const QUOTEX_URL = process.env.QUOTEX_URL || 'https://quotex.com';
const STORAGE_STATE = process.env.STORAGE_STATE || 'storageState.json';

const SHORT_SMA = parseInt(process.env.SHORT_SMA || '7', 10);
const LONG_SMA = parseInt(process.env.LONG_SMA || '21', 10);
const ATR_PERIOD = parseInt(process.env.ATR_PERIOD || '14', 10);
const ATR_THRESHOLD_PCT = parseFloat(process.env.ATR_THRESHOLD_PCT || '0.01'); // 1% default

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || null;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || null;

const HEADLESS = (process.env.HEADLESS || 'false').toLowerCase() === 'true';
const DEBUG_WS = (process.env.DEBUG_WS || 'false').toLowerCase() === 'true';
const ALLOWED_ASSETS = (process.env.ALLOWED_ASSETS || '').split(',').map(s => s.trim()).filter(Boolean);
const SIGNALS_STATE_FILE = process.env.SIGNALS_STATE || 'signals_state.json';

const MAX_WINDOW = 300; // keep last N candles per asset/timeframe

// store candles per key = `${asset}|${timeframe}`
const store = new Map();
let signalsState = {};
let saveScheduled = null;

function loadSignalsState() {
  try {
    if (fs.existsSync(SIGNALS_STATE_FILE)) {
      const txt = fs.readFileSync(SIGNALS_STATE_FILE, 'utf8');
      signalsState = JSON.parse(txt || '{}');
      console.log('Loaded signals state from', SIGNALS_STATE_FILE);
    } else {
      signalsState = {};
    }
  } catch (e) {
    console.warn('Failed to load signals state:', e.message);
    signalsState = {};
  }
}

function scheduleSaveSignalsState() {
  if (saveScheduled) return;
  saveScheduled = setTimeout(() => {
    try {
      fs.writeFileSync(SIGNALS_STATE_FILE, JSON.stringify(signalsState, null, 2));
      if (DEBUG_WS) console.log('Saved signals state to', SIGNALS_STATE_FILE);
    } catch (e) {
      console.error('Failed to save signals state:', e);
    }
    saveScheduled = null;
  }, 1000);
}

function getSavedSignalId(key) {
  return signalsState[key] || null;
}

function setSavedSignalId(key, signalId) {
  signalsState[key] = signalId;
  scheduleSaveSignalsState();
}

function storeKey(asset, timeframe) { return `${asset}|${timeframe}`; }

function pushCandle(asset, timeframe, candle) {
  const key = storeKey(asset, timeframe);
  if (!store.has(key)) store.set(key, { candles: [], lastSignalId: getSavedSignalId(key) || null });
  const b = store.get(key);
  // ensure unique by time
  const last = b.candles[b.candles.length - 1];
  if (last && last.time === candle.time) {
    // replace last candle
    b.candles[b.candles.length - 1] = candle;
  } else {
    b.candles.push(candle);
    if (b.candles.length > MAX_WINDOW) b.candles.shift();
  }
  return b;
}

// --- improved formatSignalText ---
function formatSignalText(obj) {
  return `Signal: ${obj.signal}\nAsset: ${obj.asset}\nTF: ${obj.timeframe}\nPrice: ${obj.price}\nSMA${SHORT_SMA}: ${Number(obj.smaShort).toFixed(5)}\nSMA${LONG_SMA}: ${Number(obj.smaLong).toFixed(5)}\nATR: ${Number(obj.atr).toFixed(8)}\nATR%: ${(Number(obj.atrRatio) * 100).toFixed(4)}%`;
}

// --- stronger detection for candle-like payloads ---
function detectCandlePayload(obj) {
  if (!obj || typeof obj !== 'object') return null;

  // If the object itself is an array of candles
  if (Array.isArray(obj) && obj.length && typeof obj[0] === 'object') {
    return obj;
  }

  // Direct fields
  const hasOHLC = ['o','h','l','c','t'].every(k => (k in obj)) ||
                  ['open','high','low','close','time'].every(k => (k in obj));
  if (hasOHLC) return obj;

  // Nested common containers
  if ('candles' in obj && Array.isArray(obj.candles) && obj.candles.length) return obj.candles;
  if ('data' in obj && (typeof obj.data === 'object')) {
    const d = obj.data;
    if (Array.isArray(d)) return d;
    if (['open','high','low','close','time'].some(k => k in d) || ['o','h','l','c','t'].some(k => k in d)) return d;
  }
  if ('payload' in obj) return detectCandlePayload(obj.payload);
  if ('message' in obj) return detectCandlePayload(obj.message);
  if ('result' in obj) return detectCandlePayload(obj.result);

  return null;
}

// --- normalize, validate, and normalize time (ms) ---
function normalizeCandle(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw;

  // Extract possible numeric time fields and normalize to ms integer
  let time = r.time ?? r.t ?? r.timestamp ?? r[0] ?? null;
  if (typeof time === 'string' && /^\d+$/.test(time)) time = Number(time);
  if (typeof time === 'number') {
    // if seconds (10-digit), convert to ms
    if (time > 1e9 && time < 1e11) time = Math.floor(time * 1000);
    // if already ms (13+ digits) keep as-is
    time = Math.floor(time);
  }

  const parseNum = v => {
    if (v === undefined || v === null) return NaN;
    if (typeof v === 'number') return v;
    const s = String(v).replace(/[, ]+/g, '');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
  };

  const open = parseNum(r.open ?? r.o ?? r[1] ?? r.open_price ?? r.openPrice);
  const high = parseNum(r.high ?? r.h ?? r[2] ?? r.high_price ?? r.highPrice);
  const low  = parseNum(r.low  ?? r.l ?? r[3] ?? r.low_price  ?? r.lowPrice);
  const close = parseNum(r.close ?? r.c ?? r[4] ?? r.close_price ?? r.closePrice);
  const volume = parseNum(r.volume ?? r.v ?? r[5] ?? 0);

  // Validate final values
  if (![open, high, low, close].every(Number.isFinite)) return null;
  if (!time || isNaN(time)) {
    // If time missing, fallback to Date.now()
    time = Date.now();
  }

  return {
    time,
    open, high, low, close, volume
  };
}

function computeIndicators(bucket) {
  const closes = bucket.candles.map(c => c.close);
  const highs = bucket.candles.map(c => c.high);
  const lows = bucket.candles.map(c => c.low);
  if (closes.length < LONG_SMA) return null;
  // SMA
  const smaShortArr = SMA.calculate({ period: SHORT_SMA, values: closes });
  const smaLongArr = SMA.calculate({ period: LONG_SMA, values: closes });
  if (!smaShortArr.length || !smaLongArr.length) return null;
  // ATR
  if (highs.length < ATR_PERIOD + 1) return null;
  const atrArr = ATR.calculate({ period: ATR_PERIOD, high: highs, low: lows, close: closes });
  if (!atrArr.length) return null;
  const last = {
    close: closes[closes.length - 1],
    prevClose: closes[closes.length - 2],
    smaShort: smaShortArr[smaShortArr.length - 1],
    prevSmaShort: smaShortArr[smaShortArr.length - 2] ?? null,
    smaLong: smaLongArr[smaLongArr.length - 1],
    prevSmaLong: smaLongArr[smaLongArr.length - 2] ?? null,
    atr: atrArr[atrArr.length - 1]
  };
  return last;
}

async function maybeEmitSignal(asset, timeframe, bucket) {
  const indicators = computeIndicators(bucket);
  if (!indicators) return;
  const { close, smaShort, prevSmaShort, smaLong, prevSmaLong, atr } = indicators;
  if (prevSmaShort == null || prevSmaLong == null) return;

  let signal = null;
  if (prevSmaShort <= prevSmaLong && smaShort > smaLong) signal = 'BUY';
  if (prevSmaShort >= prevSmaLong && smaShort < smaLong) signal = 'SELL';

  if (!signal) return;

  const atrRatio = atr / close;
  if (!(atrRatio < ATR_THRESHOLD_PCT)) {
    // filter out noisy market based on ATR relative to price
    return;
  }

  const lastCandle = bucket.candles[bucket.candles.length - 1];
  const signalId = `${signal}|${lastCandle.time}`;
  if (bucket.lastSignalId === signalId) return; // avoid duplicates
  bucket.lastSignalId = signalId;
  setSavedSignalId(storeKey(asset, timeframe), signalId);

  const out = {
    ts: new Date().toISOString(),
    asset, timeframe, signal,
    price: close, smaShort, smaLong, atr, atrRatio
  };
  console.log('SIGNAL', JSON.stringify(out));
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    await sendTelegram(formatSignalText(out));
  }
}

async function sendTelegram(text) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text })
    });
  } catch (e) {
    console.error('Telegram error', e);
  }
}

loadSignalsState();

(async () => {
  console.log('Starting Quotex Node bot...');
  const browser = await chromium.launch({ headless: HEADLESS, args: ['--disable-features=IsolateOrigins,site-per-process'] });
  // try to reuse storage state if exists
  const context = await (async () => {
    if (fs.existsSync(STORAGE_STATE)) {
      console.log('Using existing storage state:', STORAGE_STATE);
      return await browser.newContext({ storageState: STORAGE_STATE });
    } else {
      console.log('No storage state found. Opening browser for interactive login.');
      const c = await browser.newContext();
      const p = await c.newPage();
      await p.goto(QUOTEX_URL, { waitUntil: 'domcontentloaded' });
      console.log('Please log in manually in the opened browser. After successful login, press ENTER here to save storage state and continue.');
      await waitForEnter();
      await c.storageState({ path: STORAGE_STATE });
      console.log('Saved storage state to', STORAGE_STATE);
      return await browser.newContext({ storageState: STORAGE_STATE });
    }
  })();

  const page = await context.newPage();
  await page.goto(QUOTEX_URL, { waitUntil: 'domcontentloaded' });

  // Attach websocket listener
  page.on('websocket', ws => {
    try {
      console.log('WebSocket created:', ws.url());
      ws.on('framereceived', async frame => {
        const payload = frame.payload;
        if (DEBUG_WS) {
          try { console.log('RAW_WS_FRAME', payload); } catch (e) {}
        }
        let parsed = null;
        try {
          parsed = JSON.parse(payload);
        } catch (e) {
          // not JSON; ignore
          return;
        }
        // Heuristic: look for candle-like payloads
        // If payload is array of messages, iterate
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const it of items) {
          // Common patterns: {type: 'candle', data: {...}} or nested shapes
          let candidate = null;
          if (it && typeof it === 'object') {
            // common: it.data or it.candle or it.payload
            if (it.candle) candidate = it.candle;
            if (it.data && (it.data.open || it.data.o)) candidate = it.data;
            if (!candidate) {
              // direct detection
              const det = detectCandlePayload(it);
              if (det) candidate = det;
            }
          }
          if (candidate) {
            // candidate could be array or single candle
            if (Array.isArray(candidate)) {
              for (const c of candidate) {
                const nc = normalizeCandle(c);
                if (!nc) continue;
                // asset/timeframe may be missing, attempt to extract from frame or ws.url or it object
                const asset = (it.asset || it.instrument || it.symbol) || extractAssetFromUrl(ws.url()) || 'unknown';
                if (ALLOWED_ASSETS.length && !ALLOWED_ASSETS.includes(asset)) continue;
                const tf = (it.timeframe || it.interval || it.tf) || extractTfFromUrl(ws.url()) || 'unknown';
                const bucket = pushCandle(asset, tf, nc);
                await maybeEmitSignal(asset, tf, bucket);
              }
            } else {
              const nc = normalizeCandle(candidate);
              if (!nc) continue;
              const asset = (it.asset || it.instrument || it.symbol) || extractAssetFromUrl(ws.url()) || 'unknown';
              if (ALLOWED_ASSETS.length && !ALLOWED_ASSETS.includes(asset)) continue;
              const tf = (it.timeframe || it.interval || it.tf) || extractTfFromUrl(ws.url()) || 'unknown';
              const bucket = pushCandle(asset, tf, nc);
              await maybeEmitSignal(asset, tf, bucket);
            }
          }
        }
      });
    } catch (e) {
      console.error('WS attach error', e);
    }
  });

  console.log('Playwright setup complete. Listening for websocket frames in browser session.');
  console.log('If you want headless runs later, set HEADLESS=true and ensure storageState.json is valid.');
  // keep process alive
})();

function extractAssetFromUrl(url) {
  try {
    if (!url) return null;
    const u = new URL(url);
    const path = (u.pathname + (u.search || '')).toUpperCase();
    // common tickers: look for patterns like EURUSD, BTCUSD, EURUSD_OTC etc.
    const m = path.match(/([A-Z]{3,6}[_\-]?[A-Z0-9]{0,6})/);
    if (m) return m[1];
  } catch (e) {}
  return null;
}
function extractTfFromUrl(url) {
  try {
    if (!url) return null;
    const u = new URL(url);
    const s = u.search || '';
    const m1 = s.match(/interval=(\d+)/);
    if (m1) return m1[1];
    const m2 = (u.pathname || '').match(/_(\d+)[sS]$/);
    if (m2) return m2[1];
  } catch (e) {}
  return null;
}

function waitForEnter() {
  return new Promise(resolve => {
    process.stdin.resume();
    process.stdin.once('data', function () {
      process.stdin.pause();
      resolve();
    });
  });
}
