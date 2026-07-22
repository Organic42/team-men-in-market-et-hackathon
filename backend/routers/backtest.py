from fastapi import APIRouter
from services.backtest import run_backtest, hero_case_study

router = APIRouter()


@router.get("/report")
def report():
    """
    Full 5-year backtest: month-by-month risk score vs. actual next-month
    GIXI price change. Includes RMSE, directional accuracy, hit rate on
    large moves, false positive rate.
    """
    return run_backtest()


@router.get("/hero")
def hero():
    """
    March 2026 hero case study: 7-month timeline showing our risk score
    escalating in February, then the +69% MoM price spike in March.
    """
    return hero_case_study()
