"""ETL logic"""
import pandas as pd

from kytrade.lib.db.common import get_document, set_document


def load_from_excel(path) -> pd.DataFrame:
    """Parse the excel file containing s&p 500 data, stripping useless rows"""
    df = pd.read_excel(path)
    df = df[df.Ticker.notnull()]
    return df
