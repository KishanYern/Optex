"""IV-space smoothing and risk-neutral density extraction.

Pipeline:
  1. Build a synthetic OTM-call curve:
        - K < S : use OTM put price P, convert to call via put-call parity
                  C = P + S e^{-qT} - K e^{-rT}    (q=0)
        - K >= S: use OTM call price directly
  2. Solve implied vol per strike from each call price.
  3. Fit a cubic smoothing spline to IV(K).
  4. Evaluate the spline on a dense K grid, reprice C(K) via Black-Scholes.
  5. f(K) = e^{rT} * d^2 C / dK^2  (Breeden-Litzenberger)
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from scipy.interpolate import UnivariateSpline

from ...data import Chain
from ...iv import bs_call, implied_vol


@dataclass
class RNDResult:
    K_grid: np.ndarray
    iv_smoothed: np.ndarray
    iv_raw_K: np.ndarray
    iv_raw: np.ndarray
    C_smoothed: np.ndarray
    C_raw_K: np.ndarray
    C_raw: np.ndarray
    rnd: np.ndarray
    rnd_raw: np.ndarray
    spot: float
    T: float
    r: float


def synthetic_call_curve(chain: Chain) -> tuple[np.ndarray, np.ndarray]:
    """Return (strikes, synthetic_call_prices) using OTM puts below spot
    (converted by parity) and OTM calls above spot."""
    S, T, r = chain.spot, chain.T, chain.r
    disc_K_factor = math.exp(-r * T)

    puts = chain.puts[chain.puts["strike"] < S][["strike", "mid"]].to_numpy()
    calls = chain.calls[chain.calls["strike"] >= S][["strike", "mid"]].to_numpy()

    # parity: C = P + S - K e^{-rT}
    if len(puts):
        K_p = puts[:, 0]
        C_from_p = puts[:, 1] + S - K_p * disc_K_factor
        left = np.column_stack([K_p, C_from_p])
    else:
        left = np.empty((0, 2))

    stacked = np.vstack([left, calls]) if len(calls) else left
    if len(stacked) == 0:
        return np.array([]), np.array([])

    # Dedup any shared strikes (shouldn't happen with strict < / >= split)
    _, idx = np.unique(stacked[:, 0], return_index=True)
    stacked = stacked[np.sort(idx)]
    # Drop non-positive prices (parity can go slightly negative on noisy quotes)
    stacked = stacked[stacked[:, 1] > 0]
    return stacked[:, 0], stacked[:, 1]


def _solve_iv_vector(C: np.ndarray, K: np.ndarray, S: float, T: float, r: float) -> np.ndarray:
    out = np.empty(len(K))
    for i, (c, k) in enumerate(zip(C, K)):
        out[i] = implied_vol(float(c), S, float(k), T, r, "c")
    return out


def _filter_finite(K: np.ndarray, iv: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    mask = np.isfinite(iv) & (iv > 1e-4) & (iv < 5.0)
    return K[mask], iv[mask]


def extract_rnd(chain: Chain, smoothing: float = 0.0, n_grid: int = 400) -> RNDResult:
    S, T, r = chain.spot, chain.T, chain.r
    K_raw, C_raw = synthetic_call_curve(chain)
    if len(K_raw) < 5:
        raise ValueError("need at least 5 usable strikes")

    iv_raw = _solve_iv_vector(C_raw, K_raw, S, T, r)
    K_fit, iv_fit = _filter_finite(K_raw, iv_raw)
    if len(K_fit) < 5:
        raise ValueError("too few finite implied vols after filtering")

    # Cubic smoothing spline in IV-space.
    # s=0 -> interpolating; s>0 -> trades fit for smoothness.
    # Heuristic: scale smoothing by len(K_fit) so the slider feels stable.
    s_param = smoothing * len(K_fit)
    spline = UnivariateSpline(K_fit, iv_fit, k=3, s=s_param)

    K_lo, K_hi = K_fit.min(), K_fit.max()
    K_grid = np.linspace(K_lo, K_hi, n_grid)
    iv_smoothed = spline(K_grid)
    iv_smoothed = np.clip(iv_smoothed, 1e-4, 5.0)

    # Reprice via BS on the dense grid
    C_smoothed = np.array([bs_call(S, float(k), T, r, float(s)) for k, s in zip(K_grid, iv_smoothed)])

    # Second derivative by central differences (uniform grid)
    dK = K_grid[1] - K_grid[0]
    d2C = np.zeros_like(C_smoothed)
    d2C[1:-1] = (C_smoothed[2:] - 2 * C_smoothed[1:-1] + C_smoothed[:-2]) / (dK * dK)
    d2C[0] = d2C[1]
    d2C[-1] = d2C[-2]
    rnd = math.exp(r * T) * d2C
    rnd = np.clip(rnd, 0.0, None)  # density can't be negative

    # Also compute a "raw" RND by differencing the raw call curve directly,
    # for the educational overlay.
    rnd_raw = _raw_rnd(K_raw, C_raw, r, T)

    return RNDResult(
        K_grid=K_grid,
        iv_smoothed=iv_smoothed,
        iv_raw_K=K_fit,
        iv_raw=iv_fit,
        C_smoothed=C_smoothed,
        C_raw_K=K_raw,
        C_raw=C_raw,
        rnd=rnd,
        rnd_raw=rnd_raw,
        spot=S,
        T=T,
        r=r,
    )


def _raw_rnd(K: np.ndarray, C: np.ndarray, r: float, T: float) -> np.ndarray:
    """Non-uniform central second difference of the raw call curve."""
    n = len(K)
    out = np.full(n, np.nan)
    for i in range(1, n - 1):
        h1 = K[i] - K[i - 1]
        h2 = K[i + 1] - K[i]
        out[i] = 2 * (C[i - 1] / (h1 * (h1 + h2))
                      - C[i] / (h1 * h2)
                      + C[i + 1] / (h2 * (h1 + h2)))
    return math.exp(r * T) * out
