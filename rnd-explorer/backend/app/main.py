"""FastAPI entrypoint for the RND explorer."""
from __future__ import annotations

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from scipy.interpolate import UnivariateSpline

from .data import get_chain, get_risk_free_rate, list_expiries, year_fraction
from .diagnostics import compute_diagnostics
from .rnd import extract_rnd

app = FastAPI(title="rnd-explorer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.get("/rate")
def rate(T: float = 0.25) -> dict:
    return {"r": get_risk_free_rate(T)}


@app.get("/expiries/{ticker}")
def expiries(ticker: str) -> dict:
    try:
        exps = list_expiries(ticker)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"yfinance error: {e}")
    if not exps:
        raise HTTPException(status_code=404, detail=f"no expiries for {ticker}")
    return {"ticker": ticker.upper(), "expiries": exps}


@app.get("/chain/{ticker}/{expiry}")
def chain(ticker: str, expiry: str, r: float | None = None) -> dict:
    try:
        ch = get_chain(ticker, expiry, r_override=r)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    return {
        "ticker": ch.ticker,
        "expiry": ch.expiry,
        "spot": ch.spot,
        "T": ch.T,
        "r": ch.r,
        "calls": ch.calls.to_dict(orient="records"),
        "puts": ch.puts.to_dict(orient="records"),
    }


@app.get("/rnd/{ticker}/{expiry}")
def rnd(ticker: str, expiry: str, r: float | None = None,
        smoothing: float = 0.0, n_grid: int = 400) -> dict:
    try:
        ch = get_chain(ticker, expiry, r_override=r)
        result = extract_rnd(ch, smoothing=smoothing, n_grid=n_grid)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Re-evaluate spline at raw strikes for the RMSE residual diagnostic.
    spline = UnivariateSpline(result.iv_raw_K, result.iv_raw, k=3,
                              s=smoothing * len(result.iv_raw_K))
    iv_at_raw = spline(result.iv_raw_K)
    diag = compute_diagnostics(result, iv_at_raw)

    return {
        "ticker": ch.ticker,
        "expiry": ch.expiry,
        "spot": result.spot,
        "T": result.T,
        "r": result.r,
        "K_grid": result.K_grid.tolist(),
        "iv_smoothed": result.iv_smoothed.tolist(),
        "iv_raw_K": result.iv_raw_K.tolist(),
        "iv_raw": result.iv_raw.tolist(),
        "C_smoothed": result.C_smoothed.tolist(),
        "C_raw_K": result.C_raw_K.tolist(),
        "C_raw": result.C_raw.tolist(),
        "rnd": result.rnd.tolist(),
        "rnd_raw_K": result.C_raw_K.tolist(),
        "rnd_raw": [None if not np.isfinite(x) else float(x) for x in result.rnd_raw],
        "diagnostics": diag.as_dict(),
    }
