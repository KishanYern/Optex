import numpy as np

from app.diagnostics import (check_convexity, check_monotonicity,
                             compute_diagnostics, density_integral)
from app.rnd import extract_rnd
from tests.test_rnd import _make_flat_vol_chain


def test_monotonicity_clean_curve():
    C = np.array([10.0, 8.0, 6.0, 4.0, 2.0])
    assert check_monotonicity(C) == 0


def test_monotonicity_flags_violations():
    C = np.array([10.0, 8.0, 9.0, 4.0])  # one upward jump
    assert check_monotonicity(C) == 1


def test_convexity_clean_curve():
    # Convex: differences decrease in magnitude
    C = np.array([10.0, 6.0, 3.0, 1.0, 0.0])
    assert check_convexity(C) == 0


def test_convexity_flags_concave_region():
    # Strictly concave triple -> one violation
    C = np.array([0.0, 5.0, 7.0, 5.0, 0.0])
    assert check_convexity(C) >= 1


def test_density_integral_unit():
    x = np.linspace(-5, 5, 1001)
    pdf = np.exp(-0.5 * x ** 2) / np.sqrt(2 * np.pi)
    assert abs(density_integral(x, pdf) - 1.0) < 1e-4


def test_diagnostics_on_flat_vol_chain_are_clean():
    chain = _make_flat_vol_chain()
    res = extract_rnd(chain)
    # In a flat-vol BS world, the spline interpolates exactly.
    # iv_smoothed lives on K_grid; raw points live on iv_raw_K. We need the
    # smoothed IV at the raw strikes -- the test only needs to check that
    # the smoothed call curve obeys no-arb, not the residual itself.
    diag = compute_diagnostics(res, res.iv_raw)  # placeholder spline-at-raw
    assert diag.n_monotonicity_violations == 0
    assert diag.n_convexity_violations == 0
    assert diag.n_negative_density == 0
    assert abs(diag.integral - 1.0) < 0.05
    assert abs(diag.mean - diag.forward) / diag.forward < 0.02
