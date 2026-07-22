from fastapi import APIRouter, Query
from pydantic import BaseModel
from services.risk_scorer import get_corridor_scores, get_signal, get_events
from services.event_injector import score_headline
from services.backtest import _score_for_month, _load_monthly_prices

router = APIRouter()


@router.get("/corridors")
def corridors():
    """
    Live risk scores for the 3 corridors India depends on.
    Returns score 0-100 and trend direction.
    """
    return get_corridor_scores()


@router.get("/signal")
def signal():
    """
    30-day procurement recommendation: BUY_NOW | WAIT | PARTIAL_HEDGE.
    Includes confidence score and key driver events.
    """
    return get_signal()


@router.get("/events")
def events(days: int = 90):
    """
    Recent geopolitical events scored for India energy impact.
    Used to annotate the IGX price chart.
    """
    return get_events(days=days)


class InjectRequest(BaseModel):
    headline: str


@router.post("/inject")
def inject_event(req: InjectRequest):
    """
    Custom event injection — user types a hypothetical headline, we return
    (a) the LLM's structured extraction, (b) the deterministic corridor score
    it produces, (c) the projected 30-day GIXI move. Gives judges an
    interactive way to prove the model isn't a mock.
    """
    return score_headline(req.headline)


@router.get("/at")
def historical_state(month: str = Query(..., description="YYYY-MM")):
    """
    Time-travel: return the corridor state CruxIQ would have shown for any
    past month, using the calibrated backtest event calendar. Also returns
    the actual IGX price for that month and the actual next-month move,
    so the UI can show "predicted vs. actual".
    """
    score, active_events = _score_for_month(month)
    level = "RED" if score >= 70 else "AMBER" if score >= 40 else "GREEN"

    # Look up actual prices for that month + next month from the archive
    try:
        monthly = _load_monthly_prices()
        row = monthly[monthly["month"] == month]
        actual_price = float(row["actual_avg_price"].iloc[0]) if not row.empty else None
        mom = float(row["mom_change_pct"].iloc[0]) if not row.empty and row["mom_change_pct"].notna().iloc[0] else None

        # Next month
        idx = monthly.index[monthly["month"] == month]
        next_mom = None
        if len(idx) and idx[0] + 1 < len(monthly):
            nxt = monthly.iloc[idx[0] + 1]
            next_mom = float(nxt["mom_change_pct"]) if not (nxt["mom_change_pct"] != nxt["mom_change_pct"]) else None
    except Exception:
        actual_price = mom = next_mom = None

    return {
        "month":         month,
        "score":         score,
        "level":         level,
        "trend":         "escalating" if len(active_events) > 0 else "stable",
        "events":        [
            {"corridor": e[1], "severity": e[2] * 10, "description": e[3], "impact_type": "military"}
            for e in active_events
        ],
        "actual_price":  round(actual_price, 1) if actual_price else None,
        "mom_pct":       round(mom, 1) if mom else None,
        "next_mom_pct":  round(next_mom, 1) if next_mom else None,
    }
