from datetime import date
from calendar import monthrange
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.transaction import Transaction, TransactionType
from app.models.budget import Budget


def _month_bounds(year: int, month: int):
    start = date(year, month, 1)
    end = date(year, month, monthrange(year, month)[1])
    return start, end


def get_totals(db: Session, year: int, month: int):
    start, end = _month_bounds(year, month)

    expense_total = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(Transaction.type == TransactionType.expense)
        .filter(Transaction.date >= start, Transaction.date <= end)
        .scalar()
    )
    income_total = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(Transaction.type == TransactionType.income)
        .filter(Transaction.date >= start, Transaction.date <= end)
        .scalar()
    )
    return {
        "total_spending": round(expense_total, 2),
        "total_income": round(income_total, 2),
        "net": round(income_total - expense_total, 2),
    }


def get_spending_by_category(db: Session, year: int, month: int):
    start, end = _month_bounds(year, month)

    rows = (
        db.query(Transaction.category, func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(Transaction.type == TransactionType.expense)
        .filter(Transaction.date >= start, Transaction.date <= end)
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.amount).desc())
        .all()
    )
    return [{"category": category, "amount": round(total, 2)} for category, total in rows]


def get_monthly_trend(db: Session, year: int, month: int, months_back: int = 6):
    """Total spending for each of the last `months_back` months, ending at year/month."""
    results = []
    y, m = year, month
    for _ in range(months_back):
        start, end = _month_bounds(y, m)
        total = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
            .filter(Transaction.type == TransactionType.expense)
            .filter(Transaction.date >= start, Transaction.date <= end)
            .scalar()
        )
        results.append({"year": y, "month": m, "total_spending": round(total, 2)})
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    return list(reversed(results))


def get_month_comparison(db: Session, year: int, month: int):
    """Compare this month's spending (total + per-category) to the previous month."""
    prev_month = month - 1
    prev_year = year
    if prev_month == 0:
        prev_month = 12
        prev_year -= 1

    current = get_totals(db, year, month)["total_spending"]
    previous = get_totals(db, prev_year, prev_month)["total_spending"]
    pct_change = None
    if previous > 0:
        pct_change = round(((current - previous) / previous) * 100, 1)

    current_by_cat = {c["category"]: c["amount"] for c in get_spending_by_category(db, year, month)}
    previous_by_cat = {c["category"]: c["amount"] for c in get_spending_by_category(db, prev_year, prev_month)}
    categories = sorted(set(current_by_cat) | set(previous_by_cat))
    by_category = [
        {
            "category": cat,
            "current": current_by_cat.get(cat, 0.0),
            "previous": previous_by_cat.get(cat, 0.0),
            "change": round(current_by_cat.get(cat, 0.0) - previous_by_cat.get(cat, 0.0), 2),
        }
        for cat in categories
    ]

    return {
        "current_month": {"year": year, "month": month, "total_spending": current},
        "previous_month": {"year": prev_year, "month": prev_month, "total_spending": previous},
        "percent_change": pct_change,
        "by_category": by_category,
    }


def get_budget_progress(db: Session, year: int, month: int):
    """For each category with a budget OR spending this month, show spent vs. limit."""
    spending = {c["category"]: c["amount"] for c in get_spending_by_category(db, year, month)}
    budgets = db.query(Budget).filter(Budget.year == year, Budget.month == month).all()
    budget_by_category = {b.category: b for b in budgets}

    categories = sorted(set(spending) | set(budget_by_category))
    results = []
    for cat in categories:
        spent = round(spending.get(cat, 0.0), 2)
        budget = budget_by_category.get(cat)
        if budget:
            remaining = round(budget.monthly_limit - spent, 2)
            percent_used = round((spent / budget.monthly_limit) * 100, 1) if budget.monthly_limit > 0 else None
            exceeded_by = round(spent - budget.monthly_limit, 2) if spent > budget.monthly_limit else None
            results.append(
                {
                    "category": cat,
                    "budget_id": budget.id,
                    "monthly_limit": budget.monthly_limit,
                    "spent": spent,
                    "remaining": remaining,
                    "percent_used": percent_used,
                    "exceeded_by": exceeded_by,
                }
            )
        else:
            results.append(
                {
                    "category": cat,
                    "budget_id": None,
                    "monthly_limit": None,
                    "spent": spent,
                    "remaining": None,
                    "percent_used": None,
                    "exceeded_by": None,
                }
            )
    return results
