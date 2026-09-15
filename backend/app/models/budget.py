from sqlalchemy import Column, Integer, String, Float, UniqueConstraint
from app.database import Base


class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (UniqueConstraint("category", "month", "year", name="uq_budget_category_month_year"),)

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False, index=True)
    monthly_limit = Column(Float, nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
