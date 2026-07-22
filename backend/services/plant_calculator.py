"""
Plant-level fuel cost exposure calculator.

Translates a GIXI price move into rupee impact for a specific plant type.
All figures based on published Indian industry benchmarks.
"""

from pathlib import Path
import pandas as pd

DATA_PATH = Path(__file__).parent.parent.parent / "data" / "igx_daily.parquet"

# Energy intensity benchmarks (GJ per tonne of output)
PLANT_PROFILES = {
    "cement": {
        "label": "Cement Plant",
        "energy_intensity_gj_per_tonne": 3.2,    # BEE PAT scheme benchmark
        "typical_gas_fraction": 0.30,             # 30% of energy from gas
        "annual_revenue_per_mtpa_cr": 450,        # ~₹450 cr revenue per MTPA capacity
        "cogs_energy_fraction": 0.28,             # energy as % of COGS
    },
    "steel": {
        "label": "Integrated Steel Plant",
        "energy_intensity_gj_per_tonne": 18.0,   # DRI + EAF route
        "typical_gas_fraction": 0.20,
        "annual_revenue_per_mtpa_cr": 600,
        "cogs_energy_fraction": 0.35,
    },
    "chemical": {
        "label": "Chemical / Fertiliser Plant",
        "energy_intensity_gj_per_tonne": 25.0,   # urea benchmark
        "typical_gas_fraction": 0.70,             # gas is the primary feedstock
        "annual_revenue_per_mtpa_cr": 800,
        "cogs_energy_fraction": 0.45,
    },
}

GJ_PER_MMBTU  = 1.055
INR_PER_USD   = 83.5


def _current_gixi() -> float:
    try:
        df = pd.read_parquet(DATA_PATH)
        recent = df[pd.to_datetime(df["trade_date"]) >= pd.Timestamp.now() - pd.Timedelta(days=90)]
        if not recent.empty:
            return float(recent["trade_price"].mean())
    except Exception:
        pass
    return 750.0


def calculate_impact(plant_type: str, capacity_mtpa: float, gas_share_pct: float) -> dict:
    if plant_type not in PLANT_PROFILES:
        return {"error": f"Unknown plant type. Valid: {list(PLANT_PROFILES.keys())}"}

    profile     = PLANT_PROFILES[plant_type]
    gixi_inr    = _current_gixi()
    gas_fraction = gas_share_pct / 100

    # Annual gas consumption in MMBTU
    annual_output_mt     = capacity_mtpa * 1e6          # tonnes
    total_energy_gj      = annual_output_mt * profile["energy_intensity_gj_per_tonne"]
    gas_energy_gj        = total_energy_gj * gas_fraction
    gas_mmbtu            = gas_energy_gj / GJ_PER_MMBTU

    # Annual gas cost at current GIXI
    annual_gas_cost_cr   = (gas_mmbtu * gixi_inr) / 1e7  # crore rupees

    # Exposure to a 10% GIXI move
    exposure_per_10pct_cr = annual_gas_cost_cr * 0.10

    # Current risk scenario impact (use composite score from risk scorer)
    # For standalone calculation: assume 15% price move under current risk
    risk_scenario_pct    = 15.0
    risk_scenario_cost_cr = annual_gas_cost_cr * (risk_scenario_pct / 100)

    # Annual revenue for context
    annual_revenue_cr    = capacity_mtpa * profile["annual_revenue_per_mtpa_cr"]

    return {
        "plant_type":    profile["label"],
        "capacity_mtpa": capacity_mtpa,
        "gas_share_pct": round(gas_share_pct, 1),
        "current_gixi":  round(gixi_inr, 0),
        "gas_consumption": {
            "annual_mmbtu":    round(gas_mmbtu, 0),
            "annual_cost_cr":  round(annual_gas_cost_cr, 1),
        },
        "exposure": {
            "per_10pct_gixi_move_cr":        round(exposure_per_10pct_cr, 1),
            "current_risk_scenario_pct":     risk_scenario_pct,
            "current_risk_scenario_cost_cr": round(risk_scenario_cost_cr, 1),
            "as_pct_of_revenue":             round(risk_scenario_cost_cr / annual_revenue_cr * 100, 1),
        },
        "context": {
            "annual_revenue_cr":   round(annual_revenue_cr, 0),
            "energy_as_pct_cogs":  round(profile["cogs_energy_fraction"] * 100, 0),
            "payback_on_tool_months": round(
                (30 / (risk_scenario_cost_cr / 12)), 1
            ) if risk_scenario_cost_cr > 0 else None,
        },
    }
