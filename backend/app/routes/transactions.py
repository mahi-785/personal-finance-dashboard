from typing import Optional
from datetime import date as date_type, datetime
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import extract

from app.database import get_db
from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionOut

router = APIRouter(prefix="/transactions", tags=["transactions"])

REQUIRED_CSV_COLUMNS = {"date", "description", "category", "amount", "type"}
DATE_FORMATS = ["%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y"]


def _parse_date(raw: str) -> date_type:
    raw = raw.strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Unrecognized date format: '{raw}'")


@router.post("", response_model=TransactionOut)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    tx = Transaction(**payload.model_dump())
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.get("", response_model=list[TransactionOut])
def list_transactions(
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    category: Optional[str] = None,
    type: Optional[TransactionType] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
):
    query = db.query(Transaction)

    if search:
        query = query.filter(Transaction.description.ilike(f"%{search}%"))
    if category:
        query = query.filter(Transaction.category == category)
    if type:
        query = query.filter(Transaction.type == type)
    if year:
        query = query.filter(extract("year", Transaction.date) == year)
    if month:
        query = query.filter(extract("month", Transaction.date) == month)

    return query.order_by(Transaction.date.desc(), Transaction.id.desc()).all()


@router.get("/{transaction_id}", response_model=TransactionOut)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@router.put("/{transaction_id}", response_model=TransactionOut)
def update_transaction(transaction_id: int, payload: TransactionUpdate, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tx, field, value)
    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()
    return {"ok": True}


@router.post("/import")
async def import_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Bulk-import transactions from a CSV file with columns:
    date, description, category, amount, type

    Validates every row before inserting anything, so a bad file doesn't
    leave a half-imported mess. Returns counts plus row-level errors (if any).
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded text")

    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None or not REQUIRED_CSV_COLUMNS.issubset({f.strip() for f in reader.fieldnames}):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must have columns: {', '.join(sorted(REQUIRED_CSV_COLUMNS))}",
        )

    to_insert = []
    errors = []
    for i, row in enumerate(reader, start=2):  # row 1 is the header
        try:
            row_type = row["type"].strip().lower()
            if row_type not in ("income", "expense"):
                raise ValueError(f"type must be 'income' or 'expense', got '{row['type']}'")

            amount = float(row["amount"])
            if amount <= 0:
                raise ValueError("amount must be positive")

            description = row["description"].strip()
            category = row["category"].strip()
            if not description or not category:
                raise ValueError("description and category are required")

            tx_date = _parse_date(row["date"])

            to_insert.append(
                Transaction(
                    date=tx_date,
                    description=description,
                    amount=amount,
                    category=category,
                    type=TransactionType(row_type),
                )
            )
        except (ValueError, KeyError) as e:
            errors.append({"row": i, "error": str(e), "data": row})

    if to_insert:
        db.add_all(to_insert)
        db.commit()

    return {
        "imported": len(to_insert),
        "failed": len(errors),
        "errors": errors,
    }
