"""Tests for the RND pipeline.

Strategy: build a synthetic Chain from a known Black-Scholes world (flat vol,
no smile). The recovered RND should match the analytic lognormal density.
"""
import math

import numpy as np
import pandas as pd
import pytest

from app.data import Chain
from app.iv import bs_call, bs_put
from app.rnd import extract_rnd, synthetic_call_curve


def _make_flat_vol_chain(S=100.0, T=0.5, r=0.04, sigma=0.25,
                         k_lo=60, k_hi=160, n=41) -> Chain:
    strikes = np.linspace(k_lo, k_hi, n)
    call_mid = np.array([bs_call(S, k, T, r, sigma) for k in strikes])
    put_mid = np.array([bs_put(S, k, T, r, sigma) for k in strikes])

    def df(mid):
        return pd.DataFrame({
            "strike": strikes,
            "bid": mid * 0.99,
            "ask": mid * 1.01,
            "lastPrice": mid,
            "volume": 1,
            "openInterest": 1,
            "mid": mid,
        })

    return Chain(ticker="TEST", expiry="2099-01-01", spot=S, T=T, r=r,
                 calls=df(call_mid), puts=df(put_mid))


def _lognormal_pdf(x, S, T, r, sigma):
    # Risk-neutral density of S_T under BS: lognormal with mu = ln S + (r - sigma^2/2) T
    mu = math.log(S) + (r - 0.5 * sigma * sigma) * T
    s = sigma * math.sqrt(T)
    return np.exp(-0.5 * ((np.log(x) - mu) / s) ** 2) / (x * s * math.sqrt(2 * math.pi))


def test_synthetic_call_curve_matches_parity():
    chain = _make_flat_vol_chain()
    K, C = synthetic_call_curve(chain)
    # All recovered call prices should match BS calls at the same strikes
    expected = np.array([bs_call(chain.spot, k, chain.T, chain.r, 0.25) for k in K])
    np.testing.assert_allclose(C, expected, atol=1e-8)


def test_rnd_matches_lognormal_flat_vol():
    S, T, r, sigma = 100.0, 0.5, 0.04, 0.25
    chain = _make_flat_vol_chain(S=S, T=T, r=r, sigma=sigma)
    res = extract_rnd(chain, smoothing=0.0, n_grid=600)

    # Integral of recovered density ~ 1 (over the strike range we cover)
    integral = np.trapezoid(res.rnd, res.K_grid)
    assert integral == pytest.approx(1.0, abs=0.05)

    # Pointwise match against analytic lognormal in the body of the distribution
    expected = _lognormal_pdf(res.K_grid, S, T, r, sigma)
    body = (res.K_grid > 75) & (res.K_grid < 135)
    err = np.abs(res.rnd[body] - expected[body]).max()
    assert err < 5e-4, f"max abs density error {err}"


def test_rnd_nonnegative():
    chain = _make_flat_vol_chain()
    res = extract_rnd(chain)
    assert (res.rnd >= 0).all()


def test_rnd_mean_near_forward():
    S, T, r, sigma = 100.0, 0.5, 0.04, 0.25
    chain = _make_flat_vol_chain(S=S, T=T, r=r, sigma=sigma)
    res = extract_rnd(chain, n_grid=800)
    # E[S_T] under Q should equal forward S * e^{rT}
    mean = np.trapezoid(res.K_grid * res.rnd, res.K_grid)
    forward = S * math.exp(r * T)
    # Tolerance loose because we truncate the tails at K_lo / K_hi
    assert mean == pytest.approx(forward, rel=0.02)


def test_too_few_strikes_raises():
    chain = _make_flat_vol_chain(n=4)
    with pytest.raises(ValueError):
        extract_rnd(chain)
