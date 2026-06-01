"""Per-study packages.

Each study lives in its own subpackage (e.g. ``studies/rnd``) that exposes an
APIRouter in ``router.py``. ``app.main`` includes each study's router. Shared
infrastructure (market-data fetch in ``app.data``, Black-Scholes math in
``app.iv``) lives at the ``app`` package root so every study can reuse it.

To add a study: create ``studies/<name>/`` with an ``__init__.py`` and a
``router.py`` exposing ``router = APIRouter(...)``, then include it in
``app.main``.
"""
