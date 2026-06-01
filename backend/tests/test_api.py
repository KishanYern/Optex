"""API smoke tests with monkeypatched data layer (no network)."""
from unittest.mock import patch

import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

from app.iv import bs_call, bs_put
from app.main import app
from app.data import Chain

client = TestClient(app)


def _fake_chain():
    S, T, r, sigma = 100.0, 0.5, 0.04, 0.25
    strikes = np.linspace(60, 160, 41)
    call_mid = np.array([bs_call(S, k, T, r, sigma) for k in strikes])
    put_mid = np.array([bs_put(S, k, T, r, sigma) for k in strikes])

    def df(mid):
        return pd.DataFrame({
            "strike": strikes, "bid": mid * 0.99, "ask": mid * 1.01,
            "lastPrice": mid, "volume": 1, "openInterest": 1, "mid": mid,
        })

    return Chain(ticker="FAKE", expiry="2099-01-01", spot=S, T=T, r=r,
                 calls=df(call_mid), puts=df(put_mid))


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_expiries_endpoint():
    with patch("app.main.list_expiries", return_value=["2099-01-01", "2099-02-01"]):
        r = client.get("/expiries/FAKE")
    assert r.status_code == 200
    assert r.json()["expiries"] == ["2099-01-01", "2099-02-01"]


def test_chain_endpoint():
    with patch("app.main.get_chain", return_value=_fake_chain()):
        r = client.get("/chain/FAKE/2099-01-01")
    assert r.status_code == 200
    body = r.json()
    assert body["ticker"] == "FAKE"
    assert body["spot"] == 100.0
    assert len(body["calls"]) == 41


def test_rnd_endpoint_shape_and_diagnostics():
    with patch("app.studies.rnd.router.get_chain", return_value=_fake_chain()):
        r = client.get("/rnd/FAKE/2099-01-01")
    assert r.status_code == 200
    body = r.json()
    assert len(body["K_grid"]) == len(body["iv_smoothed"]) == len(body["rnd"])
    diag = body["diagnostics"]
    assert abs(diag["integral"] - 1.0) < 0.05
    assert abs(diag["mean"] - diag["forward"]) / diag["forward"] < 0.02
    assert diag["n_negative_density"] == 0
