import enum
from sqlalchemy import Column, Integer, String, Float, Date, Enum
from app.database import Base


class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False, index=True)
    type = Column(Enum(TransactionType), nullable=False, default=TransactionType.expense)
