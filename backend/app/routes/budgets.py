from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.budget import Budget
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetOut

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.post("", response_model=BudgetOut)
def create_or_update_budget(payload: BudgetCreate, db: Session = Depends(get_db)):
    """Create a budget for category/month/year, or update the limit if one already exists."""
    existing = (
        db.query(Budget)
        .filter(Budget.category == payload.category, Budget.month == payload.month, Budget.year == payload.year)
        .first()
    )
    if existing:
        existing.monthly_limit = payload.monthly_limit
        db.commit()
        db.refresh(existing)
        return existing

    budget = Budget(**payload.model_dump())
    db.add(budget)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Budget for this category/month already exists")
    db.refresh(budget)
    return budget


@router.get("", response_model=list[BudgetOut])
def list_budgets(db: Session = Depends(get_db), year: int | None = None, month: int | None = None):
    query = db.query(Budget)
    if year:
        query = query.filter(Budget.year == year)
    if month:
        query = query.filter(Budget.month == month)
    return query.order_by(Budget.category).all()


@router.put("/{budget_id}", response_model=BudgetOut)
def update_budget(budget_id: int, payload: BudgetUpdate, db: Session = Depends(get_db)):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(budget, field, value)
    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/{budget_id}")
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
    return {"ok": True}
