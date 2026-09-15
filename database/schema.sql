-- Reference schema. The app creates this automatically via SQLAlchemy on
-- startup (SQLite by default), but this is here for documentation, and for
-- anyone who wants to provision the PostgreSQL table by hand.

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    description VARCHAR NOT NULL,
    amount FLOAT NOT NULL,
    category VARCHAR NOT NULL,
    type VARCHAR NOT NULL CHECK (type IN ('income', 'expense'))
);

CREATE INDEX IF NOT EXISTS ix_transactions_date ON transactions (date);
CREATE INDEX IF NOT EXISTS ix_transactions_category ON transactions (category);

CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    category VARCHAR NOT NULL,
    monthly_limit FLOAT NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    UNIQUE (category, month, year)
);
