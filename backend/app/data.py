"""Chain, spot, and risk-free rate fetching via Alpaca Market Data.

We previously scraped Yahoo via yfinance, but Yahoo hard-blocks datacenter IPs
(the Render free tier in particular), so production search failed with
"Too Many Requests" on essentially every call. Alpaca's market-data API is
built for server-side access: it authenticates with an API key/secret and is
happy to serve datacenter IPs.

Credentials come from the environment:
  * ALPACA_API_KEY_ID      — your Alpaca API key id
  * ALPACA_API_SECRET_KEY  — your Alpaca API secret

Free Alpaca accounts get 15-minute-delayed options data via the "indicative"
feed and IEX stock quotes; both are sufficient for this study. Override the
feeds with ALPACA_OPTIONS_FEED / ALPACA_STOCK_FEED if you have a paid plan.

Mitigations kept from before:
  * a tiny in-memory TTL cache, keyed by (ticker, expiry, function), so the
    same chain re-fetched within TTL_SECONDS just returns the cached object;
  * one bounded retry with jitter for transient (5xx / network) errors.
    Auth failures and 4xx are not retried.
"""
from __future__ import annotations

import os
import random
import re
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Callable, TypeVar

import httpx
import numpy as np
import pandas as pd


# Alpaca endpoints. Market data lives on data.alpaca.markets; the option
# *contracts* catalog (used to enumerate expirations) lives on the trading API.
_DATA_BASE = os.getenv("ALPACA_DATA_BASE", "https://data.alpaca.markets")
_TRADING_BASE = os.getenv("ALPACA_TRADING_BASE", "https://paper-api.alpaca.markets")
_OPTIONS_FEED = os.getenv("ALPACA_OPTIONS_FEED", "indicative")
_STOCK_FEED = os.getenv("ALPACA_STOCK_FEED", "iex")

# One shared HTTP client. httpx.Client is safe to share across threads, which
# matters because FastAPI runs sync endpoints in a threadpool.
_http = httpx.Client(timeout=httpx.Timeout(15.0))

# OCC option symbol, e.g. "SPY260619C00450000": root, YYMMDD, C/P, strike*1000.
_OCC_RE = re.compile(r"^(?P<root>[A-Z0-9]+?)(?P<date>\d{6})(?P<cp>[CP])(?P<strike>\d{8})$")


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
TTL_RATE     = 3600      # 1 hour — risk-free rate moves slowly

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


def _auth_headers() -> dict[str, str]:
    key = os.getenv("ALPACA_API_KEY_ID")
    secret = os.getenv("ALPACA_API_SECRET_KEY")
    if not key or not secret:
        raise RuntimeError(
            "Alpaca credentials are not configured. Set ALPACA_API_KEY_ID and "
            "ALPACA_API_SECRET_KEY in the backend environment."
        )
    return {"APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret}


def _get(base: str, path: str, params: dict[str, Any], attempts: int = 3) -> dict:
    """GET an Alpaca JSON endpoint with bounded retry on transient failures.

    Auth (401/403) and other 4xx errors are not retried — they won't fix
    themselves. 429 and 5xx and network errors get a short jittered backoff.
    """
    headers = _auth_headers()
    url = f"{base}{path}"
    last_exc: Exception | None = None
    for i in range(attempts):
        try:
            resp = _http.get(url, params=params, headers=headers)
        except httpx.HTTPError as e:  # network/timeout — transient
            last_exc = e
            if i + 1 < attempts:
                time.sleep(0.5 + random.random() * 0.5)
            continue
        if resp.status_code < 400:
            return resp.json()
        # 4xx (except 429) are terminal.
        if resp.status_code < 500 and resp.status_code != 429:
            raise _humanize_status(resp)
        last_exc = _humanize_status(resp)
        if i + 1 < attempts:
            time.sleep(0.5 + random.random() * 0.5)
    assert last_exc is not None
    raise last_exc


def _humanize_status(resp: httpx.Response) -> Exception:
    """Map an Alpaca error response into a UI-friendly message."""
    code = resp.status_code
    if code in (401, 403):
        return RuntimeError(
            "Alpaca rejected the API credentials (401/403). Check "
            "ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY."
        )
    if code == 429:
        return RuntimeError("Alpaca rate limit hit — try again in a few seconds.")
    if code == 422:
        return RuntimeError("Alpaca rejected the request — ticker or expiry may be invalid.")
    body = resp.text.strip()
    return RuntimeError(f"Alpaca request failed ({code}): {body[:200]}")


def list_expiries(ticker: str) -> list[str]:
    key = f"exp:{ticker.upper()}"
    return _cached(key, TTL_EXPIRIES, lambda: _fetch_expiries(ticker))


def _fetch_expiries(ticker: str) -> list[str]:
    """Distinct future expiration dates from Alpaca's option contracts catalog."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    params: dict[str, Any] = {
        "underlying_symbols": ticker.upper(),
        "status": "active",
        "expiration_date_gte": today,
        "limit": 10000,
    }
    expiries: set[str] = set()
    token: str | None = None
    # Page through the catalog; cap pages so a huge underlying can't run away.
    for _ in range(10):
        if token:
            params["page_token"] = token
        data = _get(_TRADING_BASE, "/v2/options/contracts", params)
        for c in data.get("option_contracts") or []:
            exp = c.get("expiration_date")
            if exp:
                expiries.add(exp)
        token = data.get("next_page_token")
        if not token:
            break
    return sorted(expiries)


def get_spot(ticker: str) -> float:
    key = f"spot:{ticker.upper()}"
    return _cached(key, TTL_SPOT, lambda: _fetch_spot(ticker))


def _fetch_spot(ticker: str) -> float:
    data = _get(
        _DATA_BASE, f"/v2/stocks/{ticker.upper()}/snapshot", {"feed": _STOCK_FEED}
    )
    # Prefer the latest trade; fall back to the most recent bar close.
    for path in (("latestTrade", "p"), ("minuteBar", "c"), ("dailyBar", "c"),
                 ("prevDailyBar", "c")):
        node = data
        for k in path:
            node = node.get(k) if isinstance(node, dict) else None
        if isinstance(node, (int, float)) and node > 0:
            return float(node)
    raise RuntimeError(f"Alpaca returned no price for {ticker.upper()}.")


def get_risk_free_rate(T: float) -> float:
    """Continuously-compounded risk-free rate as a decimal.

    Alpaca doesn't serve Treasury yields, so this is a configurable constant
    (RISK_FREE_RATE, default 0.045 ≈ short T-bill). The UI's r-override lets the
    user pin an exact rate per request when they want one. T is accepted for
    forward compatibility."""
    try:
        return float(os.getenv("RISK_FREE_RATE", "0.045"))
    except ValueError:
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
    """Pull one expiry's option-chain snapshot and split into calls/puts.

    Alpaca keys snapshots by OCC symbol and gives a latest quote (bid/ask) and
    latest trade (last price) per contract. Volume and open interest aren't in
    the snapshot, so those columns stay NaN — ``_clean`` only needs a usable
    mid, and the downstream study treats volume/OI as optional diagnostics."""
    params: dict[str, Any] = {
        "feed": _OPTIONS_FEED,
        "expiration_date": expiry,
        "limit": 1000,
    }
    call_rows: list[dict[str, float]] = []
    put_rows: list[dict[str, float]] = []
    token: str | None = None
    for _ in range(20):
        if token:
            params["page_token"] = token
        data = _get(_DATA_BASE, f"/v1beta1/options/snapshots/{ticker.upper()}", params)
        snapshots = data.get("snapshots") or {}
        for symbol, snap in snapshots.items():
            parsed = _OCC_RE.match(symbol)
            if not parsed:
                continue
            strike = int(parsed["strike"]) / 1000.0
            quote = (snap or {}).get("latestQuote") or {}
            trade = (snap or {}).get("latestTrade") or {}
            row = {
                "strike": strike,
                "bid": float(quote.get("bp") or 0.0),
                "ask": float(quote.get("ap") or 0.0),
                "lastPrice": float(trade.get("p") or 0.0),
                "volume": np.nan,
                "openInterest": np.nan,
            }
            (call_rows if parsed["cp"] == "C" else put_rows).append(row)
        token = data.get("next_page_token")
        if not token:
            break

    cols = _REQUIRED_COLS
    calls = pd.DataFrame(call_rows, columns=cols)
    puts = pd.DataFrame(put_rows, columns=cols)


    return _clean(calls), _clean(puts)


def get_chain(ticker: str, expiry: str, r_override: float | None = None) -> Chain:
    key = f"chain:{ticker.upper()}:{expiry}"
    calls, puts = _cached(
        key, TTL_CHAIN, lambda: _fetch_chain(ticker, expiry)
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
