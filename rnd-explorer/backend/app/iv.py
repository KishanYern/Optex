"""Black-Scholes pricing and implied volatility solver.

No dividends in v1 (q=0 kept as parameter for future use).
"""
from __future__ import annotations

import math

import numpy as np
from scipy.optimize import brentq
from scipy.stats import norm


def _d1_d2(S: float, K: float, T: float, r: float, sigma: float, q: float = 0.0):
    if sigma <= 0 or T <= 0:
        raise ValueError("sigma and T must be positive")
    vol_sqrt_t = sigma * math.sqrt(T)
    d1 = (math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / vol_sqrt_t
    d2 = d1 - vol_sqrt_t
    return d1, d2


def bs_call(S: float, K: float, T: float, r: float, sigma: float, q: float = 0.0) -> float:
    if T <= 0:
        return max(S - K, 0.0)
    if sigma <= 0:
        return max(S * math.exp(-q * T) - K * math.exp(-r * T), 0.0)
    d1, d2 = _d1_d2(S, K, T, r, sigma, q)
    return S * math.exp(-q * T) * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)


def bs_put(S: float, K: float, T: float, r: float, sigma: float, q: float = 0.0) -> float:
    if T <= 0:
        return max(K - S, 0.0)
    if sigma <= 0:
        return max(K * math.exp(-r * T) - S * math.exp(-q * T), 0.0)
    d1, d2 = _d1_d2(S, K, T, r, sigma, q)
    return K * math.exp(-r * T) * norm.cdf(-d2) - S * math.exp(-q * T) * norm.cdf(-d1)


def implied_vol(price: float, S: float, K: float, T: float, r: float,
                option_type: str = "c", q: float = 0.0) -> float:
    """Brent solver on BS price minus market price. Returns NaN on failure or
    if the quote violates no-arbitrage bounds."""
    if price <= 0 or T <= 0 or S <= 0 or K <= 0:
        return float("nan")

    pricer = bs_call if option_type.lower().startswith("c") else bs_put

    # Intrinsic (lower) bound check
    if option_type.lower().startswith("c"):
        intrinsic = max(S * math.exp(-q * T) - K * math.exp(-r * T), 0.0)
        upper = S * math.exp(-q * T)
    else:
        intrinsic = max(K * math.exp(-r * T) - S * math.exp(-q * T), 0.0)
        upper = K * math.exp(-r * T)
    if price < intrinsic - 1e-8 or price > upper + 1e-8:
        return float("nan")

    def objective(sigma: float) -> float:
        return pricer(S, K, T, r, sigma, q) - price

    lo, hi = 1e-6, 5.0
    try:
        f_lo, f_hi = objective(lo), objective(hi)
        if f_lo * f_hi > 0:
            return float("nan")
        return brentq(objective, lo, hi, xtol=1e-8, maxiter=200)
    except (ValueError, RuntimeError):
        return float("nan")


def implied_vol_chain(prices: np.ndarray, strikes: np.ndarray, S: float, T: float,
                      r: float, option_type: str = "c", q: float = 0.0) -> np.ndarray:
    out = np.empty(len(strikes), dtype=float)
    for i, (p, k) in enumerate(zip(prices, strikes)):
        out[i] = implied_vol(float(p), S, float(k), T, r, option_type, q)
    return out
