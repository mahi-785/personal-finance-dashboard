from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import analytics

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(
    db: Session = Depends(get_db),
    year: int = Query(default_factory=lambda: date.today().year),
    month: int = Query(default_factory=lambda: date.today().month),
):
    totals = analytics.get_totals(db, year, month)
    by_category = analytics.get_spending_by_category(db, year, month)
    return {"year": year, "month": month, **totals, "by_category": by_category}


@router.get("/trend")
def trend(
    db: Session = Depends(get_db),
    year: int = Query(default_factory=lambda: date.today().year),
    month: int = Query(default_factory=lambda: date.today().month),
    months_back: int = 6,
):
    return analytics.get_monthly_trend(db, year, month, months_back)


@router.get("/comparison")
def comparison(
    db: Session = Depends(get_db),
    year: int = Query(default_factory=lambda: date.today().year),
    month: int = Query(default_factory=lambda: date.today().month),
):
    return analytics.get_month_comparison(db, year, month)


@router.get("/budget-progress")
def budget_progress(
    db: Session = Depends(get_db),
    year: int = Query(default_factory=lambda: date.today().year),
    month: int = Query(default_factory=lambda: date.today().month),
):
    return analytics.get_budget_progress(db, year, month)
