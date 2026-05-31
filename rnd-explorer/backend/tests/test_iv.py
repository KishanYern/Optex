import math

import numpy as np
import pytest

from app.iv import bs_call, bs_put, implied_vol, implied_vol_chain


def test_put_call_parity():
    S, K, T, r, sigma = 100.0, 100.0, 0.5, 0.04, 0.2
    c = bs_call(S, K, T, r, sigma)
    p = bs_put(S, K, T, r, sigma)
    # C - P = S - K e^{-rT}
    assert c - p == pytest.approx(S - K * math.exp(-r * T), abs=1e-9)


def test_atm_call_known_value():
    # Hull-textbook reference: S=K=100, r=5%, sigma=20%, T=1 -> call ~ 10.4506
    c = bs_call(100, 100, 1.0, 0.05, 0.2)
    assert c == pytest.approx(10.4506, abs=1e-3)


def test_zero_T_returns_intrinsic():
    assert bs_call(110, 100, 0.0, 0.05, 0.2) == 10.0
    assert bs_put(90, 100, 0.0, 0.05, 0.2) == 10.0


def test_iv_roundtrip_call():
    S, K, T, r, sigma = 100.0, 110.0, 0.5, 0.04, 0.27
    price = bs_call(S, K, T, r, sigma)
    iv = implied_vol(price, S, K, T, r, "c")
    assert iv == pytest.approx(sigma, abs=1e-5)


def test_iv_roundtrip_put_deep_otm():
    S, K, T, r, sigma = 100.0, 80.0, 0.25, 0.04, 0.35
    price = bs_put(S, K, T, r, sigma)
    iv = implied_vol(price, S, K, T, r, "p")
    assert iv == pytest.approx(sigma, abs=1e-5)


def test_iv_below_intrinsic_returns_nan():
    # Call worth less than S - K e^{-rT} is an arbitrage
    bad_price = 0.01
    assert math.isnan(implied_vol(bad_price, 100, 50, 1.0, 0.05, "c"))


def test_iv_chain_vectorized():
    S, T, r = 100.0, 0.5, 0.04
    strikes = np.array([80, 90, 100, 110, 120], dtype=float)
    true_sigmas = np.array([0.30, 0.25, 0.22, 0.24, 0.28])
    prices = np.array([bs_call(S, K, T, r, s) for K, s in zip(strikes, true_sigmas)])
    ivs = implied_vol_chain(prices, strikes, S, T, r, "c")
    np.testing.assert_allclose(ivs, true_sigmas, atol=1e-5)
