from fastapi import APIRouter, Query
from services.plant_calculator import calculate_impact

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
