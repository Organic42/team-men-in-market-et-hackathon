from datetime import date
from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()

DATA_PATH = Path(__file__).parent.parent.parent / "data" / "igx_daily.parquet"
_df: Optional[pd.DataFrame] = None


def _load() -> pd.DataFrame:
    global _df
    if _df is None:
        if not DATA_PATH.exists():
            raise HTTPException(503, "IGX data not yet available — backfill still running")
        _df = pd.read_parquet(DATA_PATH)
        _df["trade_date"] = pd.to_datetime(_df["trade_date"])
    return _df


@router.get("/prices")
def get_prices(
    frm: str = Query("2022-01-01", alias="from"),
    to:  str = Query(None),
):
    """Daily GIXI-equivalent: average trade price per day, across all hubs."""
    df = _load()
    start = pd.to_datetime(frm)
    end   = pd.to_datetime(to) if to else pd.Timestamp.now()
    mask  = (df["trade_date"] >= start) & (df["trade_date"] <= end)
    sub   = df[mask].copy()

    daily = (
        sub.groupby("trade_date")
        .agg(
            avg_trade_price=("trade_price", "mean"),
            total_trade_qty=("trade_qty",   "sum"),
            trades=("trade_price", "count"),
        )
        .reset_index()
    )
    daily["trade_date"] = daily["trade_date"].dt.strftime("%Y-%m-%d")
    return daily.to_dict(orient="records")


@router.get("/summary")
def get_summary():
    """Archive health check: row count, date range, trading days."""
    df = _load()
    return {
        "total_rows":    int(len(df)),
        "trading_days":  int(df["trade_date"].nunique()),
        "earliest_date": str(df["trade_date"].min().date()),
        "latest_date":   str(df["trade_date"].max().date()),
        "hubs":          sorted(df["hub_state"].dropna().unique().tolist()),
        "products":      sorted(df["product"].dropna().unique().tolist()),
    }


@router.get("/monthly")
def get_monthly(
    frm: str = Query("2020-12-01", alias="from"),
    to:  str = Query(None),
):
    """Monthly average price — for the correlation model and charts."""
    df = _load()
    start = pd.to_datetime(frm)
    end   = pd.to_datetime(to) if to else pd.Timestamp.now()
    mask  = (df["trade_date"] >= start) & (df["trade_date"] <= end)
    sub   = df[mask].copy()
    sub["month"] = sub["trade_date"].dt.to_period("M")

    monthly = (
        sub.groupby("month")
        .agg(
            avg_price=("trade_price", "mean"),
            total_qty=("trade_qty",   "sum"),
            trading_days=("trade_date", "nunique"),
        )
        .reset_index()
    )
    monthly["month"] = monthly["month"].astype(str)
    return monthly.to_dict(orient="records")


@router.get("/reload")
def reload_data():
    """Force reload the parquet from disk (call after backfill completes)."""
    global _df
    _df = None
    df = _load()
    return {"reloaded": True, "rows": len(df)}
