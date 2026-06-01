"""Arbitrage checks and fit quality metrics."""
from __future__ import annotations

from dataclasses import asdict, dataclass

import numpy as np

from .extract import RNDResult


@dataclass
class Diagnostics:
    integral: float                  # int f(K) dK -- should be ~1
    n_monotonicity_violations: int   # C(K) must be non-increasing in K
    n_convexity_violations: int      # C(K) must be convex in K
    n_negative_density: int          # f(K) >= 0 everywhere
    fit_rmse: float                  # IV spline RMSE on raw points
    mean: float                      # E_Q[S_T] -- should be ~ S * e^{rT}
    forward: float                   # S * e^{rT}

    def as_dict(self) -> dict:
        return asdict(self)


def check_monotonicity(C: np.ndarray) -> int:
    # In a no-arbitrage market, dC/dK is in [-e^{-rT}, 0]. We check sign here.
    return int(np.sum(np.diff(C) > 1e-9))


def check_convexity(C: np.ndarray) -> int:
    # Second difference should be >= 0 (butterfly no-arbitrage).
    second_diff = C[2:] - 2 * C[1:-1] + C[:-2]
    return int(np.sum(second_diff < -1e-9))


def density_integral(K: np.ndarray, f: np.ndarray) -> float:
    return float(np.trapezoid(f, K))


def compute_diagnostics(result: RNDResult, iv_spline_at_raw_K: np.ndarray) -> Diagnostics:
    integral = density_integral(result.K_grid, result.rnd)
    mean = float(np.trapezoid(result.K_grid * result.rnd, result.K_grid))
    forward = float(result.spot * np.exp(result.r * result.T))
    resid = result.iv_raw - iv_spline_at_raw_K
    rmse = float(np.sqrt(np.mean(resid * resid))) if len(resid) else 0.0
    return Diagnostics(
        integral=integral,
        n_monotonicity_violations=check_monotonicity(result.C_smoothed),
        n_convexity_violations=check_convexity(result.C_smoothed),
        n_negative_density=int(np.sum(result.rnd < -1e-12)),
        fit_rmse=rmse,
        mean=mean,
        forward=forward,
    )
