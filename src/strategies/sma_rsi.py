import pandas as pd

def rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    up = delta.clip(lower=0)
    down = -1 * delta.clip(upper=0)
    ma_up = up.ewm(alpha=1/period, adjust=False).mean()
    ma_down = down.ewm(alpha=1/period, adjust=False).mean()
    rs = ma_up / ma_down
    return 100 - (100 / (1 + rs))


def generate_sma_rsi_signals(df: pd.DataFrame, short: int = 20, long: int = 50, rsi_period: int = 14, rsi_thresh_low: int = 30, rsi_thresh_high: int = 70, equity: float = 1000.0, risk_pct: float = 1.0):
    """Return signals as list of dicts with rationale and suggested sizing (percent of equity)."""
    if df.empty:
        return []
    data = df.copy()
    data['sma_short'] = data['close'].rolling(short).mean()
    data['sma_long'] = data['close'].rolling(long).mean()
    data['rsi'] = rsi(data['close'], rsi_period)

    signals = []
    last_signal = None
    for idx in range(len(data)):
        row = data.iloc[idx]
        if pd.isna(row['sma_short']) or pd.isna(row['sma_long']) or pd.isna(row['rsi']):
            continue
        # Crossover logic
        prev = data.iloc[idx-1] if idx>0 else row
        bullish = (prev['sma_short'] <= prev['sma_long']) and (row['sma_short'] > row['sma_long']) and (row['rsi'] < rsi_thresh_high)
        bearish = (prev['sma_short'] >= prev['sma_long']) and (row['sma_short'] < row['sma_long']) and (row['rsi'] > rsi_thresh_low)
        if bullish:
            entry = row['close']
            stop = entry * (1 - 0.01)  # default 1% raw stop distance; user can adjust
            tp = entry * (1 + 0.02)    # default 2% TP
            size = equity * (risk_pct/100) / (entry - stop) if (entry - stop) != 0 else 0
            rationale = f"SMA short crossed above long; RSI={row['rsi']:.1f} (<{rsi_thresh_high})"
            signals.append({
                'timestamp': row.name,
                'direction': 'buy',
                'entry': float(entry),
                'stop': float(stop),
                'tp': float(tp),
                'size_units': float(size),
                'size_pct': risk_pct,
                'rationale': rationale
            })
        if bearish:
            entry = row['close']
            stop = entry * (1 + 0.01)
            tp = entry * (1 - 0.02)
            size = equity * (risk_pct/100) / (stop - entry) if (stop - entry) != 0 else 0
            rationale = f"SMA short crossed below long; RSI={row['rsi']:.1f} (>{rsi_thresh_low})"
            signals.append({
                'timestamp': row.name,
                'direction': 'sell',
                'entry': float(entry),
                'stop': float(stop),
                'tp': float(tp),
                'size_units': float(size),
                'size_pct': risk_pct,
                'rationale': rationale
            })
    return signals
