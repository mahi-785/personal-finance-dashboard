from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import transaction as _transaction_model  # noqa: F401 (registers table with Base)
from app.models import budget as _budget_model  # noqa: F401 (registers table with Base)
from app.routes import transactions, dashboard, budgets

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Personal Finance Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router)
app.include_router(dashboard.router)
app.include_router(budgets.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "Personal Finance Dashboard API"}
