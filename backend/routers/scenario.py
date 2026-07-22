from fastapi import APIRouter
from pydantic import BaseModel
from services.scenario_engine import simulate

router = APIRouter()


class ScenarioRequest(BaseModel):
    event_type: str          # "hormuz_closure" | "red_sea_suspension" | "opec_cut" | "iran_sanctions"
    severity: float          # 0.0 – 1.0
    duration_weeks: int = 4


@router.post("/simulate")
def run_scenario(req: ScenarioRequest):
    """
    Given an event type and severity, return:
    - projected GIXI price range (low / mid / high)
    - India import cost delta (USD bn / month)
    - SPR runway at projected consumption
    - recommended actions
    """
    return simulate(req.event_type, req.severity, req.duration_weeks)
