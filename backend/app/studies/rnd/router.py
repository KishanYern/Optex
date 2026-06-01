"""Risk-neutral density study endpoint.

Owns the ``/rnd`` route. Reuses shared market data (``app.data.get_chain``) and
contributes its own router, which ``app.main`` includes.
"""
from __future__ import annotations

import numpy as np
from fastapi import APIRouter, HTTPException
from scipy.interpolate import UnivariateSpline

from ...data import get_chain
from .diagnostics import compute_diagnostics
from .extract import extract_rnd

router = APIRouter(tags=["rnd"])


@router.get("/rnd/{ticker}/{expiry}")
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
