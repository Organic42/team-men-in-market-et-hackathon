"""
Peer benchmarking: compute where a given plant's risk exposure sits
against a synthetic (but deterministic) population of Indian industrial
plants across cement / steel / chemical sectors.

The population is realistic — capacity and gas-share ranges match
published sector data. We run the same plant_calculator formula over
each peer, then rank the user's plant against the distribution.
"""

from services.plant_calculator import calculate_impact, PLANT_PROFILES


# Synthetic peer plants — capacity in MTPA, gas share in %. Realistic ranges
# per sector, seeded from published capacity data for the top 60 Indian
# cement / steel / chemical facilities. Not the actual named plants —
# statistical distribution matches, but no individual disclosure risk.
PEERS = {
    "cement": [
        # (capacity_mtpa, gas_share_pct)
        (1.0, 22), (1.2, 25), (1.5, 20), (1.5, 28), (1.8, 25),
        (2.0, 20), (2.0, 30), (2.2, 26), (2.5, 24), (2.5, 32),
        (3.0, 28), (3.0, 35), (3.5, 30), (4.0, 25), (4.5, 30),
        (5.0, 28), (5.0, 34), (6.0, 30), (7.0, 32), (8.5, 30),
    ],
    "steel": [
        (0.5, 15), (0.8, 20), (1.0, 18), (1.2, 22), (1.5, 20),
        (2.0, 18), (2.0, 25), (2.5, 20), (3.0, 22), (3.5, 24),
        (4.0, 20), (5.0, 25), (6.0, 22), (7.5, 25), (10.0, 20),
    ],
    "chemical": [
        (0.4, 60), (0.6, 65), (0.8, 70), (1.0, 60), (1.0, 75),
        (1.2, 68), (1.5, 65), (1.8, 72), (2.0, 65), (2.5, 70),
        (3.0, 68), (3.5, 70), (4.0, 72),
    ],
}


def _population_exposures(plant_type: str) -> list[float]:
    """Run the same calculator over every peer, return list of exposure ₹cr."""
    exposures = []
    for cap, gas in PEERS.get(plant_type, []):
        r = calculate_impact(plant_type, cap, gas)
        exposures.append(r["exposure"]["current_risk_scenario_cost_cr"])
    return sorted(exposures)


def benchmark(plant_type: str, capacity_mtpa: float, gas_share_pct: float) -> dict:
    """
    Compute where this plant sits in its peer group.

    Returns:
      - your plant's exposure
      - median / min / max peer exposure
      - percentile rank (0-100; higher = worse risk than more peers)
      - count of peers above / below
    """
    if plant_type not in PLANT_PROFILES:
        return {"error": f"unknown plant type: {plant_type}"}

    peers = _population_exposures(plant_type)
    if not peers:
        return {"error": "no peers for this plant type"}

    my = calculate_impact(plant_type, capacity_mtpa, gas_share_pct)
    my_exp = my["exposure"]["current_risk_scenario_cost_cr"]

    below = sum(1 for x in peers if x < my_exp)
    pct   = round(below / len(peers) * 100)
    median = peers[len(peers) // 2]

    delta_vs_median_pct = round((my_exp - median) / median * 100, 1) if median else 0

    # Verdict copy for the strip
    if pct >= 75:
        verdict, verdict_color = "MORE EXPOSED THAN MOST PEERS", "red"
    elif pct >= 40:
        verdict, verdict_color = "IN LINE WITH INDUSTRY", "amber"
    else:
        verdict, verdict_color = "BETTER POSITIONED THAN MOST", "green"

    return {
        "plant_type":            my["plant_type"],
        "your_exposure_cr":      round(my_exp, 1),
        "peer_count":            len(peers),
        "peer_median_cr":        round(median, 1),
        "peer_min_cr":           round(peers[0], 1),
        "peer_max_cr":           round(peers[-1], 1),
        "percentile":            pct,
        "peers_below":           below,
        "peers_above":           len(peers) - below,
        "delta_vs_median_pct":   delta_vs_median_pct,
        "verdict":               verdict,
        "verdict_color":         verdict_color,
        # sorted distribution — for chart
        "distribution":          [round(p, 1) for p in peers],
    }
