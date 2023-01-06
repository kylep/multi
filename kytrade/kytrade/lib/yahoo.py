"""Yahoo Finance
- Appropriate for small-batch daily checks
- Rate-limited to 2,000 requests per hour per IP, 48,000 requests a day
"""
import datetime

import yfinance


def history_df_to_dict(df) -> dict:
    """Create a dict from daily history"""
    history = {}
    for date, row in df.T.iteritems():
        history[str(date.date())] = dict(row)
    return history


def download_daily_stock_history(symbol: str) -> dict:
    """Use yahoo finance to download daily stock data, ordered oldest to newest"""
    start = datetime.datetime(1900, 1, 1)
    end = datetime.date.today()
    df = yfinance.download(
        tickers=[symbol], start=start, end=end, progress=False, auto_adjust=True
    )
    return history_df_to_dict(df)
