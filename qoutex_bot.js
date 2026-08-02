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
Install:
  npm init -y
  npm i playwright technicalindicators dotenv node-fetch
  npx playwright install chromium
Run:
  node quotex_bot.js
*/
require('dotenv').config();
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

const MAX_WINDOW = 300; // keep last N candles per asset/timeframe

// store candles per key = `${asset}|${timeframe}`
const store = new Map();

function storeKey(asset, timeframe) { return `${asset}|${timeframe}`; }

function pushCandle(asset, timeframe, candle) {
  const key = storeKey(asset, timeframe);
  if (!store.has(key)) store.set(key, { candles: [], lastSignalId: null });
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

function detectCandlePayload(obj) {
  // heuristics: object contains open/high/low/close or o/h/l/c
  if (!obj || typeof obj !== 'object') return null;
  // Common shapes: {o,h,l,c,t,volume} or {open,high,low,close,time,volume}
  const lower = keys => keys.every(k => (k in obj) || (k.toLowerCase() in obj));
  if (lower(['o','h','l','c','t']) || lower(['open','high','low','close','time'])) {
    // We'll normalize later
    return obj;
  }
  // other common shape: nested objects: {candles: [...]}, or {data: {...}}
  if ('candles' in obj && Array.isArray(obj.candles) && obj.candles.length) {
    return obj.candles; // caller can handle array
  }
  return null;
}

function normalizeCandle(raw) {
  // Accept many forms and normalize to {time, open, high, low, close, volume}
  const r = raw;
  // Try fields with common names
  const time = (r.time || r.t || r[0] || r.timestamp) ;
  const open = parseFloat(r.open ?? r.o ?? r[1] ?? r.open_price ?? NaN);
  const high = parseFloat(r.high ?? r.h ?? r[2] ?? r.high_price ?? NaN);
  const low = parseFloat(r.low ?? r.l ?? r[3] ?? r.low_price ?? NaN);
  const close = parseFloat(r.close ?? r.c ?? r[4] ?? r.close_price ?? NaN);
  const volume = parseFloat(r.volume ?? r.v ?? 0);
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

function formatSignalText(obj) {
  return `Signal: ${obj.signal}\nAsset: ${obj.asset}\nTF: ${obj.timeframe}\nPrice: ${obj.price}\nSMA${SHORT_SMA}: ${obj.smaShort.toFixed(5)}\nSMA${LONG_SMA}: ${obj.smaLong.toFixed(5)}\nATR: ${obj.atr.toFixed(6)}\nATR%: ${(obj.atrRatio*100).toFixed(3)}%`;
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

(async () => {
  console.log('Starting Quotex Node bot...');
  const browser = await chromium.launch({ headless: false, args: ['--disable-features=IsolateOrigins,site-per-process'] });
  // try to reuse storage state if exists
  const context = await (async () => {
    const fs = require('fs');
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
                // asset/timeframe may be missing, attempt to extract from frame or ws.url or it object
                const asset = (it.asset || it.instrument || it.symbol) || extractAssetFromUrl(ws.url()) || 'unknown';
                const tf = (it.timeframe || it.interval || it.tf) || extractTfFromUrl(ws.url()) || 'unknown';
                const bucket = pushCandle(asset, tf, nc);
                await maybeEmitSignal(asset, tf, bucket);
              }
            } else {
              const nc = normalizeCandle(candidate);
              const asset = (it.asset || it.instrument || it.symbol) || extractAssetFromUrl(ws.url()) || 'unknown';
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
  console.log('If you want headless runs later, set headless: true and ensure storageState.json is valid.');
  // keep process alive
})();

function extractAssetFromUrl(url) {
  // simple heuristics for asset names in ws url, adapt if needed
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    const m = path.match(/(EURUSD|AUDUSD|BTCUSD|[A-Z]{3,6}[_\-]?\w*)/i);
    if (m) return m[1];
  } catch (e) {}
  return null;
}
function extractTfFromUrl(url) {
  try {
    const u = new URL(url);
    const m = u.search.match(/interval=(\d+)/) || u.pathname.match(/_(\d+)s/);
    if (m) return m[1];
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
