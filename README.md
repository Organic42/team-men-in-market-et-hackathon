# CruxIQ — AI-Driven Energy Supply Chain Resilience

**ET AI Hackathon 2026 · Problem Statement 2**

An AI-powered intelligence platform for Indian industrial energy buyers. Turns raw geopolitical noise into procurement decisions before price shocks hit domestic gas markets.

---

## The one-sentence pitch

> Cement, steel, and chemical plants in India spend 25–35% of their cost of goods on energy but have no forward visibility into geopolitical risk. CruxIQ gives their CFO a Bloomberg-terminal-grade signal for ₹30 lakh/year — with a demonstrated 77.8% hit rate on geopolitical price shocks over the last 5 years.

---

## What's in the box

- `igx_scraper.py` — Full historical scraper for the Indian Gas Exchange. Backfilled from inception (Dec 2020) through today. **11,926 rows, 1,397 trading days, 13 columns.**
- `data/igx_daily.parquet` — The archive. Refreshed daily by rerunning the scraper with no args.
- `backend/` — FastAPI service (7 endpoints) that wraps the data with a risk-scoring, scenario-modeling, and plant-exposure layer.
- `frontend/` — React + Vite SPA with 6 screens and a dual-theme system (Bloomberg terminal ↔ modern SaaS).

## The 6 screens

| # | Route          | What it does |
|---|----------------|--------------|
| 1 | `/`            | Risk Command Center — 3 corridor gauges, world map, live event feed |
| 2 | `/prices`      | IGX price history 2020→2026 with annotated geopolitical events |
| 3 | `/signal`      | 30-day procurement recommendation (BUY_NOW / HEDGE / WAIT) |
| 4 | `/scenario`    | Interactive scenario simulator (Hormuz closure, OPEC cut, etc.) |
| 5 | `/plant`       | Plant-level rupee exposure calculator |
| 6 | `/backtest`    | 5-year historical accuracy report + March 2026 hero case study |

---

## Quick start

### 1. Backend
```bash
cd backend
pip install fastapi uvicorn httpx groq python-dotenv pyarrow pandas
# Optional: create .env with GROQ_API_KEY=xxx for live LLM event extraction
uvicorn main:app --port 8000 --reload
```

API docs at http://localhost:8000/docs

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### 3. Data refresh (optional)
```bash
python igx_scraper.py            # incremental — just today's trades
python igx_scraper.py --backfill  # full re-pull from inception
```

---

## Architecture

```
    ┌──────────┐    ┌──────────────┐    ┌───────────────┐
    │  GDELT   │──▶│ risk_scorer  │──▶│ /api/risk/*   │──┐
    │  (news)  │    │  (Groq LLM)  │    └───────────────┘  │
    └──────────┘    └──────────────┘                       │
                                                            │
    ┌──────────────┐    ┌────────────┐    ┌──────────────┐  │    ┌────────────┐
    │ IGX Scraper  │──▶│  Parquet   │──▶│ /api/igx/*   │──┼──▶│ React SPA  │
    │ (daily cron) │    │  archive   │    └──────────────┘  │    │ 6 screens  │
    └──────────────┘    └────────────┘                       │    │ 2 themes   │
                              │                              │    └────────────┘
                              ▼                              │
                        ┌──────────────┐    ┌──────────────┐ │
                        │ backtest.py  │──▶│/api/backtest/│─┤
                        └──────────────┘    └──────────────┘ │
                                                              │
                        ┌──────────────┐    ┌──────────────┐  │
                        │scenario_eng. │──▶│/api/scenario/│──┤
                        └──────────────┘    └──────────────┘  │
                                                              │
                        ┌──────────────┐    ┌──────────────┐  │
                        │plant_calc.py │──▶│ /api/plant/* │──┘
                        └──────────────┘    └──────────────┘
```

## Key design decisions

- **Deterministic scoring, not LLM judgment.** The LLM (Groq/Llama-3.1) extracts structured events from news; a hand-calibrated formula converts events → risk scores. This keeps the model auditable, reproducible, and free of hallucinated numbers.
- **Same multipliers for scenario simulation and backtest.** Forward-looking simulations and backward-looking accuracy checks use the exact same math. No convenient recalibration for the demo.
- **Honest metrics.** The backtest separates geopolitical-driven big moves (which we should catch) from demand-driven moves (which a geopolitical model can't predict). We report both.
- **Two themes for two audiences.** Bloomberg terminal aesthetic for the CFO's desk; modern SaaS for board meetings and marketing screenshots.

---

## Backtest results (5-year, honest)

| Metric | Value |
|--------|-------|
| Months evaluated | 67 |
| Directional accuracy | 61.2% |
| **Geopolitical hit rate** | **77.8%** — of 18 geopolitically-driven big moves |
| False positive rate | 12.5% — 1 out of 8 RED flags |
| Hero case | March 2026 · +69% MoM spike · signal fired February 2026 |

For a 2 MTPA cement plant at 30% gas share: **₹10.2 crore avoided** by acting on the February 2026 signal.

---

## Team

Built for the ET AI Hackathon 2026 · Submission date: July 22, 2026
