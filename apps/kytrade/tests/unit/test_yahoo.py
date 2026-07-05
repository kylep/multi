"""Tests for kytrade.yahoo."""

import json

import pandas as pd

from kytrade import yahoo


def make_history_df(rows: dict) -> pd.DataFrame:
    df = pd.DataFrame.from_dict(rows, orient="index")
    df.index = pd.to_datetime(df.index)
    return df


def test_history_df_to_dict_converts_rows():
    df = make_history_df(
        {
            "2026-01-02": {
                "Open": 10.0,
                "High": 12.0,
                "Low": 9.5,
                "Close": 11.0,
                "Volume": 1000.0,
            }
        }
    )
    history = yahoo.history_df_to_dict(df)
    assert history == {
        "2026-01-02": {
            "open": 10.0,
            "high": 12.0,
            "low": 9.5,
            "close": 11.0,
            "volume": 1000,
        }
    }


def test_history_df_to_dict_scrubs_nan():
    df = make_history_df(
        {
            "2026-01-02": {
                "Open": float("nan"),
                "High": 12.0,
                "Low": 9.5,
                "Close": 11.0,
                "Volume": float("nan"),
            }
        }
    )
    history = yahoo.history_df_to_dict(df)
    day = history["2026-01-02"]
    assert day["open"] is None
    assert day["volume"] is None
    json.dumps(history, allow_nan=False)


def test_history_df_to_dict_drops_all_nan_rows():
    df = make_history_df(
        {
            "2026-01-02": {field: float("nan") for field in yahoo.PRICE_FIELDS},
            "2026-01-03": {
                "Open": 1.0,
                "High": 1.0,
                "Low": 1.0,
                "Close": 1.0,
                "Volume": 5.0,
            },
        }
    )
    history = yahoo.history_df_to_dict(df)
    assert list(history) == ["2026-01-03"]


def test_history_df_to_dict_casts_volume_to_int():
    df = make_history_df(
        {
            "2026-01-02": {
                "Open": 1.0,
                "High": 1.0,
                "Low": 1.0,
                "Close": 1.0,
                "Volume": 123456789.0,
            }
        }
    )
    history = yahoo.history_df_to_dict(df)
    volume = history["2026-01-02"]["volume"]
    assert volume == 123456789
    assert type(volume) is int


def test_history_df_to_dict_empty_frame():
    assert yahoo.history_df_to_dict(pd.DataFrame()) == {}
