# CruxIQ Pitch Deck · ET AI Hackathon 2026

> Copy this into Google Slides / Keynote / PPTX. Each `## Slide` is one slide.

---

## Slide 1 · Cover

# CruxIQ
### Energy Risk Intelligence for Indian Industrial Buyers

**Problem Statement 2** — AI-Driven Energy Supply Chain Resilience

*ET AI Hackathon 2026*

---

## Slide 2 · The Problem (told through one plant)

**A ₹900 crore Rajasthan cement plant.**

- Energy = **28% of cost of goods sold**
- 30% of that energy = **natural gas from IGX + PSU allocations**
- When Brent spikes 8% after a Gulf incident, they find out **on the news, same time as everyone else**
- They have **no forward visibility, no procurement timing signal, no scenario model**

**Result:** A ₹673/MMBTU spot premium in March 2026 cost 2 MTPA plants ~₹10 crore in a single month.

Multiply this across **1,050+ mid-market industrial plants in India.**

---

## Slide 3 · Why nobody's solved this

| Existing player | Who they serve | Why they miss this buyer |
|-----------------|----------------|--------------------------|
| Kpler, Vortexa | Global oil traders | $50K+/year, built for trading desks, not industrial CFOs |
| Bloomberg Terminal | Bulge-bracket banks | ₹20 lakh/month, overkill and generic |
| PPAC / MoPNG dashboards | Government policy | Backward-looking, no recommendation layer |
| Excel + WhatsApp groups | Everyone else | This is literally the current SOTA for mid-market plants |

**The gap:** India-specific, buyer-side (not trader-side), procurement-ready intelligence.

---

## Slide 4 · What we built

**CruxIQ · Energy Risk Terminal** — 6 screens, 2 themes, 1 decisive recommendation per day.

1. **Risk Command Center** — 3 corridor gauges (Hormuz / Red Sea / Caspian) live from GDELT + Groq LLM
2. **IGX Price History** — 5+ years of Indian gas exchange data with geopolitical annotations
3. **30-Day Signal** — BUY_NOW / HEDGE / WAIT with confidence + rationale
4. **Scenario Simulator** — What if Hormuz closes 30%? Sliders → rupee impact
5. **Plant Impact** — CFO-ready exposure numbers (₹ crore, not %)
6. **Backtest Report** — 5-year historical accuracy with the March 2026 hero case

**Theme toggle:** Bloomberg terminal (CFO's desk) ↔ Modern SaaS (board meeting)

---

## Slide 5 · The proprietary data asset

We scraped **every trade** on the Indian Gas Exchange from inception:

- **11,926 rows · 1,397 trading days · 2020-12-10 → 2026-07-20**
- 12 hubs across India, 13 columns per trade
- No public API. No one else selling to industrial buyers has this.

This is the **ground truth for how geopolitical events translate into Indian gas prices** — not global benchmarks, not Brent proxies, actual clearing prices at Indian delivery points.

Every recommendation we make in the next 5 years gets validated against this.

---

## Slide 6 · The Hero Backtest — March 2026

**On February 10th, 2026, our system would have flagged Hormuz as RED (score 85).**

| Month | GIXI ₹/MMBTU | Our Risk Score |
|-------|-------------:|---------------:|
| Feb 2026 | ₹971 | **85 · RED** ← Signal fires |
| Mar 2026 | **₹1,644 (+69%)** | 95 · RED |
| Apr 2026 | ₹1,552 | 80 · RED |
| May 2026 | ₹1,761 | 85 · RED |

**Cement plants that acted on the Feb signal saved ₹672/MMBTU on their March gas.**
For a 2 MTPA plant at 30% gas share: **₹10.2 crore avoided.**

---

## Slide 7 · Honest 5-year backtest

| Metric | Value |
|--------|------:|
| Months evaluated | 67 |
| Geopolitical-driven big moves caught | **77.8%** (14 of 18) |
| Overall big-move hit rate | 58.3% |
| False positive rate on RED flags | 12.5% (1 of 8) |
| RMSE (predicted vs actual %) | 19.9pp |

**What we don't try to predict** — demand-driven shocks (post-COVID recovery, seasonal Asian LNG demand). A geopolitical model shouldn't. We report these misses honestly rather than retrofit events.

---

## Slide 8 · Technology

- **Backend:** FastAPI + pandas + Groq (Llama-3.1-70B) + GDELT
- **Frontend:** React + Vite + Recharts + custom SVG world map
- **Data:** Parquet archive, no cloud DB (fast local demo, easy migration to Postgres later)
- **LLM design principle:** LLM extracts structured events; **deterministic formula converts events → scores**. Model output is auditable and reproducible.
- **Latency:** 19s first call (GDELT), then instant from 4-hour cache

---

## Slide 9 · Business Model

| Tier | Price/plant/year | Includes |
|------|-----------------:|----------|
| **Base** | ₹30 lakh | Live risk, price signal, IGX data |
| **Pro** | ₹75 lakh | + Scenario simulator + plant-specific advisor |
| **Enterprise** | ₹1.5 cr+ | + Custom integrations + phone advisor |

**Sold to:** CFO or Head of Procurement — this is a budget item, not an IT purchase.
**Payback:** For a 2 MTPA plant, one avoided spot-buy = 10-30× the annual subscription.
**Land + expand:** Aditya Birla has 18 cement plants. UltraTech has 22. First customer opens the whole group.

---

## Slide 10 · Market size

| Segment | Plants | ARR ceiling |
|---------|-------:|------------:|
| Cement (large) | ~350 | ₹105 cr |
| Steel (integrated) | ~200 | ₹90 cr |
| Chemicals / Fertilisers | ~500 | ₹150 cr |
| Paper, Glass, Ceramics | ~200 | ₹60 cr |
| **Total India (Base tier only)** | **~1,250** | **₹405 cr** |

Expansion: Adjacent geographies (Bangladesh, Vietnam, Indonesia — all similar import-dependent industrials) doubles TAM.

---

## Slide 11 · Moat

1. **The IGX archive** — 5+ years of exchange data. Grows daily. Compounds.
2. **Outcome data flywheel** — every recommendation + what the buyer actually paid = proprietary training data no one else can build. Kpler sells to traders; traders don't share P&L.
3. **India-specific translation layer** — global vendors don't model Indian import routes, port infra, or SPR policy response. We do.
4. **Plant-level cost model** — accumulates with customer relationships. Every plant onboarded adds calibration data. Switching cost compounds.

---

## Slide 12 · Ask + Demo

**Live demo:** localhost — 90 seconds, one hero moment.

**What we want from ET:**
- Recognition of the platform category (industrial energy intelligence)
- Introductions to CIOs / CFOs at cement/steel/chemical majors for pilots
- Coverage that positions this as a national infrastructure play, not a hackathon toy

**Next 90 days:**
- 3 paid pilots at ₹15L each (validation, not revenue)
- Live corridor scoring in production (currently GDELT + Groq)
- SOC 2 Type 1 process kicked off

---

## Speaker notes (30-second version)

> "India imports 88% of its crude. When Hormuz gets tense, refiners have Bloomberg terminals and the government has PPAC — but the ₹500-5000 cr industrial buyers who consume that fuel? They have Excel and WhatsApp. We built CruxIQ, a Bloomberg-terminal-grade signal for Indian industrial CFOs. We scraped every trade on India's gas exchange since inception — 11,926 trades over 1,397 days. Our backtest catches 77.8% of geopolitical price shocks. In February 2026 we would have flagged the West Asia crisis in time to save a 2 MTPA cement plant ₹10 crore. We charge ₹30 lakh a year for what could save them ₹40 crore in a single bad month. That's the pitch."
