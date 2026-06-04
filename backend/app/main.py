"""FastAPI entrypoint.

Owns the app, CORS, and the shared market-data endpoints (/health, /rate,
/expiries, /chain) that every study reuses. Each study contributes its own
router under app/studies/<name>/router.py; register them here via
include_router.
"""
from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .data import get_chain, get_risk_free_rate, list_expiries
from .studies.rnd.router import router as rnd_router

app = FastAPI(title="optex")

# CORS: comma-separated list of allowed origins. Defaults to local dev.
# In prod, set CORS_ORIGINS to your Vercel URL(s), e.g.
#   CORS_ORIGINS=https://rnd-explorer.vercel.app,https://*.vercel.app
_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000")
_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]
# Always allow Vercel preview URLs (https://<branch>-<scope>.vercel.app) so
# branch/PR previews work without listing each one in CORS_ORIGINS.
_origin_regex = r"https://.*\.vercel\.app$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=_origin_regex,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Study routers. Add a new study by including its router here.
app.include_router(rnd_router)


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
        raise HTTPException(status_code=502, detail=str(e))
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
