from datetime import datetime, timezone

import numpy as np
import pandas as pd
import pytest

from app.data import _clean, year_fraction


def test_year_fraction_positive():
    yf_ = year_fraction("2099-01-01", now=datetime(2098, 1, 1, tzinfo=timezone.utc))
    assert yf_ == pytest.approx(1.0, abs=0.01)


def test_year_fraction_past_is_zero():
    yf_ = year_fraction("2000-01-01", now=datetime(2026, 1, 1, tzinfo=timezone.utc))
    assert yf_ == 0.0


def test_clean_computes_mid_from_bid_ask():
    df = pd.DataFrame({
        "strike": [90, 100, 110],
        "bid":    [10.0, 5.0, 1.0],
        "ask":    [10.4, 5.2, 1.2],
        "lastPrice": [10.1, 5.1, 1.1],
        "volume": [1, 2, 3],
        "openInterest": [10, 20, 30],
    })
    out = _clean(df)
    np.testing.assert_allclose(out["mid"], [10.2, 5.1, 1.1])


def test_clean_falls_back_to_last_price_when_no_quote():
    df = pd.DataFrame({
        "strike": [100],
        "bid":    [0.0],
        "ask":    [0.0],
        "lastPrice": [4.2],
        "volume": [0],
        "openInterest": [0],
    })
    out = _clean(df)
    assert out["mid"].iloc[0] == 4.2


def test_clean_drops_zero_and_nan_rows():
    df = pd.DataFrame({
        "strike": [90, 100, 110, 120],
        "bid":    [1.0, 0.0, np.nan, 2.0],
        "ask":    [1.2, 0.0, np.nan, 2.2],
        "lastPrice": [1.1, 0.0, np.nan, 2.1],
        "volume": [1, 0, 0, 1],
        "openInterest": [1, 0, 0, 1],
    })
    out = _clean(df)
    assert list(out["strike"]) == [90, 120]


def test_clean_sorts_by_strike():
    df = pd.DataFrame({
        "strike": [110, 90, 100],
        "bid":    [1.0, 10.0, 5.0],
        "ask":    [1.2, 10.4, 5.2],
        "lastPrice": [1.1, 10.2, 5.1],
        "volume": [1, 1, 1],
        "openInterest": [1, 1, 1],
    })
    out = _clean(df)
    assert list(out["strike"]) == [90, 100, 110]
