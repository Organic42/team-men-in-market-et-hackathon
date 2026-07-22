from dotenv import load_dotenv
from pathlib import Path

# Load .env in the backend/ folder before any router imports so os.getenv sees the key.
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import igx, risk, scenario, plant, backtest

app = FastAPI(title="CruxIQ Energy Risk API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(igx.router,      prefix="/api/igx",      tags=["IGX Market Data"])
app.include_router(risk.router,     prefix="/api/risk",     tags=["Geopolitical Risk"])
app.include_router(scenario.router, prefix="/api/scenario", tags=["Scenario Simulator"])
app.include_router(plant.router,    prefix="/api/plant",    tags=["Plant Impact"])
app.include_router(backtest.router, prefix="/api/backtest", tags=["Backtest"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
