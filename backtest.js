# Backtest harness for QOUTEX-BOT
# Usage: node backtest.js path/to/candles.csv
# CSV format expected: time,open,high,low,close,volume

const fs = require('fs');
const { SMA, ATR } = require('technicalindicators');

const SHORT = parseInt(process.env.SHORT_SMA || '7', 10);
const LONG = parseInt(process.env.LONG_SMA || '21', 10);
const ATR_PERIOD = parseInt(process.env.ATR_PERIOD || '14', 10);

function parseCsv(path) {
  const txt = fs.readFileSync(path, 'utf8');
  const lines = txt.split(/\r?\n/).filter(Boolean);
  const rows = lines.map(l => l.split(',').map(s => s.trim()));
  // if header
  if (isNaN(Number(rows[0][1]))) rows.shift();
  return rows.map(r => ({ time: Number(r[0]), open: parseFloat(r[1]), high: parseFloat(r[2]), low: parseFloat(r[3]), close: parseFloat(r[4]), volume: parseFloat(r[5]||0) }));
}

function runStrategy(candles) {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  const smaShort = SMA.calculate({ period: SHORT, values: closes });
  const smaLong = SMA.calculate({ period: LONG, values: closes });
  const atrArr = ATR.calculate({ period: ATR_PERIOD, high: highs, low: lows, close: closes });

  // align lengths
  const start = Math.max(SHORT, LONG, ATR_PERIOD) + 1;
  let wins = 0, losses = 0, trades = 0;
  let equity = 0;
  for (let i = start; i < candles.length-1; i++) {
    const idxS = i - (closes.length - smaShort.length);
    const idxL = i - (closes.length - smaLong.length);
    const idxAtr = i - (closes.length - atrArr.length);
    const prevS = smaShort[idxS-1];
    const prevL = smaLong[idxL-1];
    const curS = smaShort[idxS];
    const curL = smaLong[idxL];
    if (prevS==null || prevL==null || curS==null || curL==null || atrArr[idxAtr]==null) continue;
    let signal = null;
    if (prevS <= prevL && curS > curL) signal = 'BUY';
    if (prevS >= prevL && curS < curL) signal = 'SELL';
    if (!signal) continue;
    trades++;
    const entry = candles[i].close;
    const next = candles[i+1].close; // simple 1-candle duration
    const win = (signal==='BUY' && next>entry) || (signal==='SELL' && next<entry);
    if (win) { wins++; equity += 1; } else { losses++; equity -= 1; }
  }
  return { trades, wins, losses, winrate: trades? (wins/trades):0, equity };
}

if (process.argv.length < 3) {
  console.log('Usage: node backtest.js path/to/candles.csv');
  process.exit(1);
}

const path = process.argv[2];
const candles = parseCsv(path);
const res = runStrategy(candles);
console.log('Backtest result:', res);
