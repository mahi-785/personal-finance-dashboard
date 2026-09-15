# 💰 Personal Finance Dashboard

A full-stack app for tracking income/expenses and seeing where your money
goes: monthly totals, spending-by-category breakdown, a 6-month trend chart,
budgets with progress bars, month-over-month comparison, CSV import, and
search/filtering — with full CRUD on transactions.

**Stack:** React + TypeScript (Vite) · FastAPI · SQLAlchemy · SQLite by
default, swappable to PostgreSQL with one env var.

This build covers Phases 1–10 from the original plan.

## Project structure

```
personal-finance-dashboard/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, route wiring
│   │   ├── database.py          # SQLAlchemy engine/session (SQLite/Postgres)
│   │   ├── models/
│   │   │   ├── transaction.py
│   │   │   └── budget.py
│   │   ├── schemas/
│   │   │   ├── transaction.py
│   │   │   └── budget.py
│   │   ├── routes/
│   │   │   ├── transactions.py   # CRUD + search/filter + CSV import
│   │   │   ├── dashboard.py      # summary, trend, comparison, budget-progress
│   │   │   └── budgets.py        # budget CRUD
│   │   └── services/analytics.py # all SQL aggregation logic
│   ├── seed.py                   # loads sample-transactions.csv via the API
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── SummaryCards.tsx
│       │   ├── SpendingChart.tsx    # pie + trend line charts
│       │   ├── BudgetProgress.tsx   # budget bars, set/edit/remove inline
│       │   ├── MonthComparison.tsx  # this month vs. last month
│       │   ├── CsvImport.tsx        # file upload + row-level error feedback
│       │   ├── TransactionForm.tsx
│       │   └── TransactionTable.tsx
│       ├── pages/Dashboard.tsx  # main page, wires everything together
│       └── services/api.ts     # typed fetch wrapper
├── database/
│   ├── schema.sql               # reference schema (for Postgres / docs)
│   └── sample-transactions.csv
└── README.md
```

## 1. Run the backend

Requires Python 3.10+.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

if this gives error do these steps
python3.13 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

The API is now live at `http://localhost:8000`. It creates `finance.db`
(SQLite) automatically on first run — no database setup needed.

Interactive API docs: `http://localhost:8000/docs`

Optional — load sample data:

```bash
python seed.py
```

### Using PostgreSQL instead of SQLite

```bash
pip install psycopg2-binary
export DATABASE_URL="postgresql://user:password@localhost:5432/finance_dashboard"
uvicorn app.main:app --reload --port 8000
```

No code changes needed — `database.py` reads `DATABASE_URL` and the models
work with either engine. `database/schema.sql` has the equivalent DDL if you
want to provision the tables by hand.

## 2. Run the frontend

Requires Node 18+.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. It talks to the API at `http://localhost:8000`
(hardcoded in `src/services/api.ts` — change `API_BASE` there if you run the
backend elsewhere).

Both dev servers need to be running at the same time (backend on 8000,
frontend on 5173).

## What it does

- **Add / edit / delete transactions** with date, description, amount,
  category, and income/expense type.
- **Monthly dashboard**: total spending, total income, net, spending broken
  down by category (pie chart), and a 6-month spending trend (line chart).
- **Budgets**: set a monthly limit per category directly from the progress
  view; see a progress bar and remaining amount, or "exceeded by $X" once
  you're over.
- **Month-over-month comparison**: this month's total vs. last month, with a
  percent change and the categories that moved the most.
- **CSV import**: upload a `.csv` with `date, description, category, amount,
  type` columns. Every row is validated before anything is inserted into a
  clean batch; rows that don't insert (bad date, non-positive amount, etc.)
  are reported individually so nothing silently fails.
- **Search and filter** transactions by description text or category.
- **Month/year picker** to look at any period.
- All aggregation (totals, category breakdown, trend, comparison, budget
  progress) happens in SQL via SQLAlchemy (`GROUP BY`, `SUM`), not in
  JavaScript — that's the part worth highlighting in an interview.

## API endpoints

```
POST   /transactions                 create
GET    /transactions                 list (supports ?search=&category=&type=&year=&month=)
GET    /transactions/{id}            get one
PUT    /transactions/{id}            update
DELETE /transactions/{id}            delete
POST   /transactions/import          bulk import from a CSV file (multipart/form-data)

POST   /budgets                      create, or update the limit if one already exists for that category/month/year
GET    /budgets                      list (supports ?year=&month=)
PUT    /budgets/{id}                 update
DELETE /budgets/{id}                 delete

GET    /dashboard/summary?year=&month=            totals + spending by category
GET    /dashboard/trend?year=&month=&months_back=  last N months of spending
GET    /dashboard/comparison?year=&month=          this month vs. last month, overall and by category
GET    /dashboard/budget-progress?year=&month=      spent vs. limit per category
```

## CSV format for import

```csv
date,description,category,amount,type
2026-09-01,Chipotle,Food,14.50,expense
2026-09-02,Paycheck,Income,2500.00,income
```

- `date` accepts `YYYY-MM-DD`, `MM/DD/YYYY`, or `MM/DD/YY`.
- `type` must be `income` or `expense`.
- `amount` must be a positive number.
- A sample file is at `database/sample-transactions.csv`.

## Ideas for further extension

- Recurring transactions (rent, subscriptions) that auto-generate monthly.
- Multi-currency support.
- Auth, so the dashboard supports more than one user.
- Exporting transactions back out to CSV or PDF.
