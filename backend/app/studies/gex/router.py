from __future__ import annotations

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException

from ...data import get_chain, list_expiries
from ...iv import implied_vol, bs_gamma

router = APIRouter(tags=["gex"])

@router.get("/gex/chain/{ticker}/{expiry}")
def gex_chain(ticker: str, expiry: str, r: float | None = None) -> dict:
    try:
        ch = get_chain(ticker, expiry, r_override=r)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    S = ch.spot
    T = ch.T
    r_val = ch.r

    def compute_gex(df: pd.DataFrame, is_call: bool):
        out = []
        for _, row in df.iterrows():
            K = float(row["strike"])
            mid = float(row["mid"])
            vol = float(row.get("volume", np.nan))
            oi = float(row.get("openInterest", np.nan))
            if np.isnan(oi):
                oi = 0.0
            
            # 1. Calc implied vol
            iv = implied_vol(mid, S, K, T, r_val, option_type="c" if is_call else "p")
            
            # 2. Calc Gamma
            gamma = 0.0
            if not np.isnan(iv) and iv > 0:
                gamma = bs_gamma(S, K, T, r_val, iv)
            
            # 3. Calc GEX
            # Standard GEX: Gamma * OI * 100 * Spot Price
            # Positive for calls, negative for puts
            gex = gamma * oi * 100 * S * (1 if is_call else -1)
            
            out.append({
                "strike": K,
                "mid": mid,
                "volume": vol if not np.isnan(vol) else 0.0,
                "oi": oi,
                "iv": iv if not np.isnan(iv) else 0.0,
                "gamma": gamma,
                "gex": gex
            })
        return out

    calls_gex = compute_gex(ch.calls, True)
    puts_gex = compute_gex(ch.puts, False)

    # Calculate Walls
    call_wall = max(calls_gex, key=lambda x: x["gex"])["strike"] if calls_gex else 0
    put_wall = min(puts_gex, key=lambda x: x["gex"])["strike"] if puts_gex else 0

    return {
        "ticker": ch.ticker,
        "expiry": ch.expiry,
        "spot": S,
        "call_wall": call_wall,
        "put_wall": put_wall,
        "calls": calls_gex,
        "puts": puts_gex,
    }

@router.get("/gex/heatmap/{ticker}")
def gex_heatmap(ticker: str) -> dict:
    try:
        expiries = list_expiries(ticker)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    
    if not expiries:
        raise HTTPException(status_code=404, detail="No expiries found")

    # Limit to nearest 6 expiries to avoid long wait
    target_expiries = expiries[:6]
    heatmap_data = []

    for expiry in target_expiries:
        try:
            ch = get_chain(ticker, expiry)
        except Exception:
            continue
        
        S = ch.spot
        T = ch.T
        r_val = ch.r

        # Combine calls and puts, get GEX and mid premium
        for _, row in ch.calls.iterrows():
            K = float(row["strike"])
            mid = float(row["mid"])
            oi = float(row.get("openInterest", 0.0))
            if np.isnan(oi): oi = 0.0
            
            # Filter strikes +/- 20% of spot to keep data size reasonable
            if ch.spot * 0.8 <= K <= ch.spot * 1.2:
                iv = implied_vol(mid, S, K, T, r_val, option_type="c")
                gamma = bs_gamma(S, K, T, r_val, iv) if not np.isnan(iv) and iv > 0 else 0.0
                gex = gamma * oi * 100 * S
                
                heatmap_data.append({
                    "expiry": expiry,
                    "strike": K,
                    "type": "call",
                    "premium": mid,
                    "gex": gex
                })
        for _, row in ch.puts.iterrows():
            K = float(row["strike"])
            mid = float(row["mid"])
            oi = float(row.get("openInterest", 0.0))
            if np.isnan(oi): oi = 0.0
            
            if ch.spot * 0.8 <= K <= ch.spot * 1.2:
                iv = implied_vol(mid, S, K, T, r_val, option_type="p")
                gamma = bs_gamma(S, K, T, r_val, iv) if not np.isnan(iv) and iv > 0 else 0.0
                gex = gamma * oi * 100 * S * -1
                
                heatmap_data.append({
                    "expiry": expiry,
                    "strike": K,
                    "type": "put",
                    "premium": mid,
                    "gex": gex
                })

    return {
        "ticker": ticker.upper(),
        "heatmap": heatmap_data
    }
