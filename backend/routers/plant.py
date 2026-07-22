from fastapi import APIRouter, Query
from services.plant_calculator import calculate_impact
from services.peer_benchmark import benchmark
from services.portfolio import build_portfolio

router = APIRouter()


@router.get("/impact")
def plant_impact(
    plant_type: str   = Query("cement", description="cement | steel | chemical"),
    capacity_mtpa: float = Query(2.0,   description="Annual production capacity in MTPA"),
    gas_share_pct: float = Query(30.0,  description="% of energy mix from natural gas"),
):
    """
    For a notional plant, calculate rupee exposure to a GIXI price move
    under the current risk scenario.
    """
    return calculate_impact(plant_type, capacity_mtpa, gas_share_pct)


@router.get("/benchmark")
def plant_benchmark(
    plant_type: str      = Query("cement"),
    capacity_mtpa: float = Query(2.0),
    gas_share_pct: float = Query(30.0),
):
    """
    Where does this plant sit against ~15-20 realistic peer plants?
    Returns percentile rank, median peer, delta vs. median, and the full
    sorted distribution for charting.
    """
    return benchmark(plant_type, capacity_mtpa, gas_share_pct)


@router.get("/portfolio")
def portfolio():
    """
    Enterprise portfolio view: 15 realistic plants across cement / steel /
    chemical, sorted by exposure. Includes group totals + sector breakdown.
    The story for land-and-expand.
    """
    return build_portfolio()
