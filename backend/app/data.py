"""Chain, spot, and risk-free rate fetching via yfinance.

yfinance scrapes Yahoo's unofficial endpoints, which rate-limit IPs hard
(especially on shared cloud hosts). We mitigate with:
  * a tiny in-memory TTL cache, keyed by (ticker, expiry, function).
    Same chain re-fetched within TTL_SECONDS just returns the cached object.
  * one bounded retry with jittered backoff for transient errors.
"""
from __future__ import annotations

import random
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Callable, TypeVar

import numpy as np
import pandas as pd
import yfinance as yf


@dataclass
class Chain:
    ticker: str
    expiry: str
    spot: float
    T: float
    r: float
    calls: pd.DataFrame
    puts: pd.DataFrame


_REQUIRED_COLS = ["strike", "bid", "ask", "lastPrice", "volume", "openInterest"]

# Cache TTLs (seconds). Quotes don't change meaningfully in <60s for our use.
TTL_EXPIRIES = 300       # 5 min — expiry list never changes intra-day
TTL_CHAIN    = 60        # 1 min — chain mid prices are slow-moving enough
TTL_SPOT     = 30        # 30 s — spot moves continuously
TTL_RATE     = 3600      # 1 hour — ^IRX moves slowly

_cache: dict[str, tuple[float, Any]] = {}
_cache_lock = threading.Lock()

T_ = TypeVar("T_")


def _cached(key: str, ttl: int, fn: Callable[[], T_]) -> T_:
    now = time.monotonic()
    with _cache_lock:
        hit = _cache.get(key)
        if hit and now - hit[0] < ttl:
            return hit[1]  # type: ignore[no-any-return]
    value = fn()
    with _cache_lock:
        _cache[key] = (now, value)
    return value


def _with_retry(fn: Callable[[], T_], attempts: int = 2) -> T_:
    """One retry with jitter for transient yfinance errors."""
    last_exc: Exception | None = None
    for i in range(attempts):
        try:
            return fn()
        except Exception as e:  # noqa: BLE001 — yfinance raises bare Exceptions
            last_exc = e
            msg = str(e).lower()
            # Don't retry obvious 4xx-class failures.
            if any(s in msg for s in ("not found", "no data", "404")):
                break
            if i + 1 < attempts:
                time.sleep(0.6 + random.random() * 0.6)
    assert last_exc is not None
    raise _humanize(last_exc)


def _humanize(e: Exception) -> Exception:
    """Map yfinance's vague errors into something useful for the UI."""
    msg = str(e)
    low = msg.lower()
    if "too many requests" in low or "rate limit" in low or "429" in low:
        return RuntimeError(
            "yfinance error: Too Many Requests. Rate limited. Try again in a minute."
        )
    if "no data" in low or "expecting value" in low:
        return RuntimeError("yfinance returned no data — ticker may be invalid.")
    return e


def list_expiries(ticker: str) -> list[str]:
    key = f"exp:{ticker.upper()}"
    return _cached(key, TTL_EXPIRIES, lambda: _with_retry(
        lambda: list(yf.Ticker(ticker).options)
    ))


def get_spot(ticker: str) -> float:
    key = f"spot:{ticker.upper()}"
    return _cached(key, TTL_SPOT, lambda: _with_retry(lambda: _fetch_spot(ticker)))


def _fetch_spot(ticker: str) -> float:
    tk = yf.Ticker(ticker)
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
    """^IRX (13-week T-bill yield) as continuously-compounded decimal rate.
    Cached for an hour. T parameter is accepted for forward compatibility."""
    return _cached("rate:^IRX", TTL_RATE, _fetch_irx)


def _fetch_irx() -> float:
    try:
        irx = yf.Ticker("^IRX").history(period="5d")
        if not irx.empty:
            pct = float(irx["Close"].dropna().iloc[-1])
            simple = pct / 100.0
            if simple > 0:
                return float(np.log1p(simple))
    except Exception:
        pass
    return 0.045


def year_fraction(expiry: str, now: datetime | None = None) -> float:
    now = now or datetime.now(timezone.utc)
    exp = datetime.strptime(expiry, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    seconds = (exp - now).total_seconds()
    return max(seconds / (365.25 * 24 * 3600), 0.0)


def _clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in _REQUIRED_COLS:
        if col not in df.columns:
            df[col] = np.nan
    df = df[_REQUIRED_COLS]
    has_quote = (df["bid"] > 0) & (df["ask"] > 0)
    df["mid"] = np.where(has_quote, (df["bid"] + df["ask"]) / 2.0, df["lastPrice"])
    df = df.dropna(subset=["strike", "mid"])
    df = df[df["mid"] > 0]
    df = df.sort_values("strike").reset_index(drop=True)
    return df


def _fetch_chain(ticker: str, expiry: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    opt = yf.Ticker(ticker).option_chain(expiry)
    return _clean(opt.calls), _clean(opt.puts)


def get_chain(ticker: str, expiry: str, r_override: float | None = None) -> Chain:
    key = f"chain:{ticker.upper()}:{expiry}"
    calls, puts = _cached(
        key, TTL_CHAIN, lambda: _with_retry(lambda: _fetch_chain(ticker, expiry))
    )
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
        calls=calls,
        puts=puts,
    )
