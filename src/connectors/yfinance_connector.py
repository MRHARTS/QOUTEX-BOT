import yfinance as yf
import pandas as pd

def fetch_ohlcv_yfinance(ticker: str, interval: str = '1m', period: str = '7d') -> pd.DataFrame:
    """Fetch OHLCV from yfinance. interval examples: '1m','5m','1h'. period e.g. '7d','30d'.
    Note: yfinance 1m interval may be limited for longer periods.
    """
    data = yf.download(tickers=ticker, interval=interval, period=period, progress=False)
    if data.empty:
        return pd.DataFrame()
    df = data[['Open','High','Low','Close','Volume']].rename(columns={
        'Open':'open','High':'high','Low':'low','Close':'close','Volume':'volume'
    })
    df.index = pd.to_datetime(df.index)
    return df
