# rnd-explorer

Single-expiration risk-neutral density (RND) extractor for equity options.

Pulls a call/put chain for one expiry, smooths implied vol across strikes with a
cubic spline, reprices on a dense K grid, and takes the discrete second
derivative of C(K) to recover the risk-neutral density f(S_T).

## Deployment

Backend on Render, frontend on Vercel, auto-deployed on push to `main`
once CI is green (see `.github/workflows/deploy.yml`).

## Stack

- **Backend:** Python, FastAPI, yfinance, NumPy, SciPy
- **Frontend:** Next.js + React + Plotly

## Layout

```
backend/
  app/
    main.py          FastAPI app + shared market-data routes (/health, /rate,
                     /expiries, /chain); includes each study's router
    data.py          yfinance chain fetch, spot, risk-free rate (shared)
    iv.py            Black-Scholes pricing and IV solver (shared)
    studies/
      rnd/           Risk-neutral density study
        router.py    /rnd endpoint
        extract.py   IV-space spline, RND extraction
        diagnostics.py  Arbitrage checks, fit quality
  requirements.txt
frontend/
  src/
    app/
      page.tsx                       home (study grid)
      visualizations/<slug>/page.tsx one page per study
    lib/visualizations.ts            study registry (single source of truth)
    components/                      shared UI
```

**Adding a study.** Backend: create `app/studies/<name>/` with a `router.py`
exposing `router = APIRouter(...)`, then `include_router` it in `app/main.py`;
reuse `app.data` / `app.iv`. Frontend: add an entry to `lib/visualizations.ts`
and a `visualizations/<slug>/page.tsx`.

## Run locally with one command

From the repo root:

```
pwsh dev.ps1
```

Starts uvicorn (backend, port 8000) and `npm run dev` (frontend, port 3000) in
the same terminal. Ctrl+C stops both — the script kills the full process tree
so npm's child `node` process is cleaned up too.

## Run with Docker

```
docker compose up --build
```

- Backend: http://localhost:8000 (FastAPI, hot reload on `backend/app` changes)
- Frontend: http://localhost:3000 (Next.js dev server, hot reload on `frontend/` changes)

Run backend tests inside the container:
```
docker compose run --rm backend pytest -v
```

## Run locally without Docker

Backend:
```
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:
```
cd frontend
npm install
npm run dev
```
