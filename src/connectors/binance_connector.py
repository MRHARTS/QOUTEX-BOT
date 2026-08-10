import ccxt
import pandas as pd
from datetime import datetime

def fetch_ohlcv_binance(symbol: str, timeframe: str = '1m', limit: int = 1000) -> pd.DataFrame:
    """Fetch OHLCV from Binance public REST via ccxt and return a pandas DataFrame."""
    exchange = ccxt.binance({
        'enableRateLimit': True,
    })
    # ccxt uses symbols like 'BTC/USDT'
    ohlcv = exchange.fetch_ohlcv(symbol, timeframe=timeframe, limit=limit)
    df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
    df.set_index('timestamp', inplace=True)
    return df
