import streamlit as st
import pandas as pd
from datetime import datetime, timedelta
from src.connectors.binance_connector import fetch_ohlcv_binance
from src.connectors.yfinance_connector import fetch_ohlcv_yfinance
from src.strategies.sma_rsi import generate_sma_rsi_signals

st.set_page_config(page_title='QOUTEX-BOT Signal Generator', layout='wide')

st.title('QOUTEX-BOT — Honest Signal Generator (Public Beta)')

# Sidebar controls
st.sidebar.header('Configuration')
asset_class = st.sidebar.selectbox('Asset class', ['Crypto', 'Forex', 'Stock'])
if asset_class == 'Crypto':
    symbol = st.sidebar.selectbox('Symbol', ['BTC/USDT', 'ETH/USDT'])
elif asset_class == 'Forex':
    symbol = st.sidebar.selectbox('Symbol', ['EUR/USD'])
else:
    symbol = st.sidebar.selectbox('Symbol', ['AAPL', 'SPY'])

timeframe = st.sidebar.selectbox('Timeframe', ['1m','3m','5m','15m','30m','1h'])
equity = st.sidebar.number_input('Equity (for sizing)', min_value=1.0, value=1000.0, step=1.0)
risk_pct = st.sidebar.slider('Per-trade risk (%)', min_value=0.1, max_value=2.0, value=1.0, step=0.1)
period_days = st.sidebar.number_input('Backtest window (days)', min_value=1, max_value=365, value=30)

st.sidebar.markdown('---')
st.sidebar.markdown('Public-beta, paper-only. Signals are suggestions; not financial advice.')

# Main
if st.button('Fetch & Analyze'):
    with st.spinner('Fetching data...'):
        df = pd.DataFrame()
        if asset_class == 'Crypto':
            # ccxt expects 'BTC/USDT'
            df = fetch_ohlcv_binance(symbol, timeframe=timeframe, limit=1000)
        elif asset_class == 'Forex':
            # yfinance ticker for EUR/USD is 'EURUSD=X'
            yf_ticker = 'EURUSD=X'
            df = fetch_ohlcv_yfinance(yf_ticker, interval=timeframe, period=f"{period_days}d")
        else:
            df = fetch_ohlcv_yfinance(symbol, interval=timeframe, period=f"{period_days}d")
    if df.empty:
        st.error('No data returned for the selected symbol/timeframe. Try a shorter period or different symbol.')
    else:
        st.success('Data fetched')
        st.subheader('Price')
        st.line_chart(df['close'])
        st.subheader('Generated Signals')
        signals = generate_sma_rsi_signals(df, equity=equity, risk_pct=risk_pct)
        if not signals:
            st.info('No signals generated for the selected inputs.')
        else:
            signals_df = pd.DataFrame(signals)
            signals_df['timestamp'] = pd.to_datetime(signals_df['timestamp'])
            st.dataframe(signals_df[['timestamp','direction','entry','stop','tp','size_pct','size_units','rationale']])
            csv = signals_df.to_csv(index=False).encode('utf-8')
            st.download_button('Download signals CSV', csv, file_name='signals.csv')
