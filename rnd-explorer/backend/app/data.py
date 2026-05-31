"""Chain, spot, and risk-free rate fetching via yfinance."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import yfinance as yf


@dataclass
class Chain:
    ticker: str
    expiry: str            # "YYYY-MM-DD"
    spot: float
    T: float               # year fraction to expiry
    r: float               # continuously-compounded risk-free rate (decimal)
    calls: pd.DataFrame    # columns: strike, bid, ask, mid, lastPrice, volume, openInterest
    puts: pd.DataFrame


_REQUIRED_COLS = ["strike", "bid", "ask", "lastPrice", "volume", "openInterest"]


def list_expiries(ticker: str) -> list[str]:
    return list(yf.Ticker(ticker).options)


def get_spot(ticker: str) -> float:
    tk = yf.Ticker(ticker)
    # fast_info is the cheapest path; fall back to history if missing.
    try:
        s = float(tk.fast_info["last_price"])
        if s > 0:
            return s
    except Exception:
        pass
    hist = tk.history(period="1d")
    if hist.empty:
        raise RuntimeError(f"could not fetch spot for {ticker}")
    return float(hist["Close"].iloc[-1])


def get_risk_free_rate(T: float) -> float:
    """Use ^IRX (13-week T-bill yield, quoted as annualized percent).
    Returns continuously-compounded decimal rate. T is accepted for future
    term-structure interpolation; v1 uses ^IRX flat."""
    try:
        irx = yf.Ticker("^IRX").history(period="5d")
        if not irx.empty:
            pct = float(irx["Close"].dropna().iloc[-1])
            # IRX is quoted as a percent of an annualized simple yield.
            simple = pct / 100.0
            # Convert to continuously compounded: r = ln(1 + simple).
            if simple > 0:
                return float(np.log1p(simple))
    except Exception:
        pass
    return 0.045  # sensible fallback


def year_fraction(expiry: str, now: datetime | None = None) -> float:
    now = now or datetime.now(timezone.utc)
    exp = datetime.strptime(expiry, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    # Use end-of-day for expiry (US options expire 16:00 ET; close enough).
    seconds = (exp - now).total_seconds()
    return max(seconds / (365.25 * 24 * 3600), 0.0)


def _clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in _REQUIRED_COLS:
        if col not in df.columns:
            df[col] = np.nan
    df = df[_REQUIRED_COLS]
    # mid = (bid + ask) / 2 when both > 0, else lastPrice as fallback.
    has_quote = (df["bid"] > 0) & (df["ask"] > 0)
    df["mid"] = np.where(has_quote, (df["bid"] + df["ask"]) / 2.0, df["lastPrice"])
    df = df.dropna(subset=["strike", "mid"])
    df = df[df["mid"] > 0]
    df = df.sort_values("strike").reset_index(drop=True)
    return df


def get_chain(ticker: str, expiry: str, r_override: float | None = None) -> Chain:
    tk = yf.Ticker(ticker)
    opt = tk.option_chain(expiry)
    spot = get_spot(ticker)
    T = year_fraction(expiry)
    if T <= 0:
        raise ValueError(f"expiry {expiry} is not in the future")
    r = r_override if r_override is not None else get_risk_free_rate(T)
    return Chain(
        ticker=ticker.upper(),
        expiry=expiry,
        spot=spot,
        T=T,
        r=r,
        calls=_clean(opt.calls),
        puts=_clean(opt.puts),
    )
