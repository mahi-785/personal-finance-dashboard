from typing import Optional
from pydantic import BaseModel, ConfigDict


class BudgetBase(BaseModel):
    category: str
    monthly_limit: float
    month: int
    year: int


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    monthly_limit: Optional[float] = None


class BudgetOut(BudgetBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class BudgetProgress(BaseModel):
    category: str
    budget_id: Optional[int] = None
    monthly_limit: Optional[float] = None
    spent: float
    remaining: Optional[float] = None
    percent_used: Optional[float] = None
    exceeded_by: Optional[float] = None
