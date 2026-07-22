"""
Multi-plant enterprise portfolio view.

A realistic mixed-sector portfolio of ~15 plants — the kind of book a large
Indian industrial group (Aditya Birla / Vedanta / JSW) would run. Each row
is computed by the same plant_calculator formula used on the individual
Plant Impact screen, so numbers roll up cleanly.

Plant names are pseudonymised (P1..P15 + city hints) — statistical
distribution is realistic but there is no individual disclosure.
"""

from services.plant_calculator import calculate_impact


# (plant_id, plant_type, capacity_mtpa, gas_share_pct, region)
PORTFOLIO = [
    ("P01 · Rajasthan West",    "cement",   3.5, 32, "West"),
    ("P02 · Gujarat South",     "cement",   2.5, 28, "West"),
    ("P03 · Madhya Pradesh N.", "cement",   4.0, 25, "Central"),
    ("P04 · Andhra Coast",      "cement",   5.0, 30, "South"),
    ("P05 · Karnataka Central", "cement",   2.0, 26, "South"),
    ("P06 · Jharkhand",         "steel",    3.0, 22, "East"),
    ("P07 · Odisha Kalinganagar","steel",   5.0, 24, "East"),
    ("P08 · Chhattisgarh Bhilai","steel",   4.0, 20, "Central"),
    ("P09 · Karnataka Toranagallu","steel", 2.5, 18, "South"),
    ("P10 · Gujarat Dahej",     "chemical", 1.5, 68, "West"),
    ("P11 · Maharashtra Nagothane","chemical",1.2,72,"West"),
    ("P12 · UP Phulpur",        "chemical", 1.0, 65, "North"),
    ("P13 · Assam Namrup",      "chemical", 0.8, 70, "East"),
    ("P14 · Tamil Nadu Manali", "chemical", 1.5, 62, "South"),
    ("P15 · Gujarat Vadodara",  "chemical", 2.0, 75, "West"),
]


def build_portfolio() -> dict:
    plants = []
    for pid, ptype, cap, gas, region in PORTFOLIO:
        r = calculate_impact(ptype, cap, gas)
        exp = r["exposure"]["current_risk_scenario_cost_cr"]
        rev = r["context"]["annual_revenue_cr"]
        plants.append({
            "id":                 pid,
            "plant_type":         ptype,
            "region":             region,
            "capacity_mtpa":      cap,
            "gas_share_pct":      gas,
            "annual_revenue_cr":  rev,
            "annual_gas_cost_cr": r["gas_consumption"]["annual_cost_cr"],
            "exposure_cr":        exp,
            "exposure_pct_rev":   r["exposure"]["as_pct_of_revenue"],
            "level":              "RED" if exp >= 60 else "AMBER" if exp >= 30 else "GREEN",
        })

    # Sort descending by exposure by default
    plants.sort(key=lambda p: p["exposure_cr"], reverse=True)

    total_exp = round(sum(p["exposure_cr"] for p in plants), 1)
    total_rev = round(sum(p["annual_revenue_cr"] for p in plants), 1)
    total_gas = round(sum(p["annual_gas_cost_cr"] for p in plants), 1)
    red_count   = sum(1 for p in plants if p["level"] == "RED")
    amber_count = sum(1 for p in plants if p["level"] == "AMBER")

    # By sector
    by_sector = {}
    for p in plants:
        s = p["plant_type"]
        by_sector.setdefault(s, {"count": 0, "exposure_cr": 0.0})
        by_sector[s]["count"] += 1
        by_sector[s]["exposure_cr"] += p["exposure_cr"]
    for s in by_sector:
        by_sector[s]["exposure_cr"] = round(by_sector[s]["exposure_cr"], 1)

    return {
        "plants": plants,
        "summary": {
            "plant_count":         len(plants),
            "total_exposure_cr":   total_exp,
            "total_revenue_cr":    total_rev,
            "total_gas_spend_cr":  total_gas,
            "group_exposure_pct":  round(total_exp / total_rev * 100, 2) if total_rev else 0,
            "red_plants":          red_count,
            "amber_plants":        amber_count,
            "green_plants":        len(plants) - red_count - amber_count,
            "arr_ceiling_cr":      round(len(plants) * 0.30, 1),  # ₹30L per plant per year
        },
        "by_sector": by_sector,
    }
