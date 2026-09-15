from datetime import date as date_type
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TransactionType(str, Enum):
    income = "income"
    expense = "expense"


class TransactionBase(BaseModel):
    date: date_type
    description: str
    amount: float
    category: str
    type: TransactionType


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    date: Optional[date_type] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    type: Optional[TransactionType] = None


class TransactionOut(TransactionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
