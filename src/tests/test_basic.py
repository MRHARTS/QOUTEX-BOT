from src.strategies.sma_rsi import generate_sma_rsi_signals
from src.connectors.binance_connector import fetch_ohlcv_binance

# Simple smoke test

def test_binance_fetch():
    df = fetch_ohlcv_binance('BTC/USDT', timeframe='1m', limit=10)
    assert not df.empty


def test_strategy():
    df = fetch_ohlcv_binance('BTC/USDT', timeframe='1m', limit=200)
    signals = generate_sma_rsi_signals(df)
    assert isinstance(signals, list)
