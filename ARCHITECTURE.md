# CruxIQ Architecture

## System overview

```mermaid
flowchart LR
    subgraph SOURCES["External Data Sources"]
        GDELT[("GDELT<br/>Global news events")]
        IGX[("IGX<br/>Indian Gas Exchange")]
    end

    subgraph DATA["Data Layer"]
        SCRAPER["igx_scraper.py<br/>Month-chunked, checkpointed<br/>11,926 rows · 1,397 days"]
        PARQUET[("igx_daily.parquet<br/>2020-12 → 2026-07")]
        SCRAPER --> PARQUET
    end

    subgraph SERVICES["Backend Services · FastAPI"]
        RISK["risk_scorer.py<br/>GDELT → Groq LLM → deterministic score<br/>4hr cache · fallback for demo"]
        BACKTEST["backtest.py<br/>Historical event calendar<br/>Same multipliers as scenario_engine"]
        SCENARIO["scenario_engine.py<br/>Calibrated price impact math<br/>Deterministic, no LLM in path"]
        PLANT["plant_calculator.py<br/>Energy intensity + gas share<br/>→ rupee exposure"]
    end

    subgraph API["REST API · localhost:8000"]
        R1["/api/risk/*"]
        R2["/api/backtest/*"]
        R3["/api/scenario/*"]
        R4["/api/plant/*"]
        R5["/api/igx/*"]
    end

    subgraph UI["React SPA · localhost:5173"]
        S1["Risk Center<br/>3 gauges + world map"]
        S2["Price History<br/>Recharts + annotations"]
        S3["30-Day Signal<br/>Big status card"]
        S4["Scenario<br/>Sliders + bar chart"]
        S5["Plant Impact<br/>KPI cards"]
        S6["Backtest<br/>Accuracy + hero timeline"]
        THEME[["Theme Toggle<br/>Bloomberg ↔ SaaS"]]
    end

    GDELT --> RISK
    PARQUET --> BACKTEST
    PARQUET --> SCENARIO
    PARQUET --> PLANT
    PARQUET --> R5

    RISK --> R1
    BACKTEST --> R2
    SCENARIO --> R3
    PLANT --> R4

    R1 --> S1
    R1 --> S3
    R5 --> S2
    R2 --> S2
    R2 --> S6
    R3 --> S4
    R4 --> S5
```

## Data flow: how a demo works

```mermaid
sequenceDiagram
    participant CFO as Cement CFO
    participant UI as React SPA
    participant API as FastAPI
    participant RS as risk_scorer
    participant GDELT
    participant Groq

    CFO->>UI: Opens /signal
    UI->>API: GET /api/risk/signal
    API->>RS: get_signal()
    RS->>RS: check cache (4hr TTL)
    alt Cache hit
        RS-->>API: cached scores
    else Cache miss
        par 3 corridors in sequence
            RS->>GDELT: last 3d news for Hormuz
            GDELT-->>RS: article list
            RS->>Groq: extract events → JSON
            Groq-->>RS: {events, severity, trend}
            RS->>RS: deterministic score formula
        end
    end
    API-->>UI: {action: BUY_NOW, confidence: 87, ...}
    UI->>CFO: Renders big status card
    Note over CFO: "Lock in 60-day supply now"
```

## Design principles

1. **LLM extracts, formula scores.** No hallucinated numbers reach the recommendation.
2. **Same math forward and backward.** Scenario simulation and backtest share multipliers.
3. **Never block the demo.** GDELT slow? Use calibrated fallback. Groq missing key? Skip and use baseline score.
4. **Checkpoint everything.** Scraper saves after each month. If the process dies, nothing is lost.
