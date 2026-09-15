import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  BudgetProgress as BudgetProgressType,
  DashboardSummary,
  MonthComparison as MonthComparisonType,
  NewTransaction,
  Transaction,
  TrendPoint,
} from "../services/api";
import SummaryCards from "../components/SummaryCards";
import { CategoryPieChart, SpendingTrendChart } from "../components/SpendingChart";
import TransactionForm from "../components/TransactionForm";
import TransactionTable from "../components/TransactionTable";
import BudgetProgressList from "../components/BudgetProgress";
import MonthComparisonCard from "../components/MonthComparison";
import CsvImport from "../components/CsvImport";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Dashboard() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgressType[]>([]);
  const [comparison, setComparison] = useState<MonthComparisonType | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txs, summaryData, trendData, budgetData, comparisonData] = await Promise.all([
        api.listTransactions({ year, month, search: search || undefined, category: category || undefined }),
        api.getSummary(year, month),
        api.getTrend(year, month, 6),
        api.getBudgetProgress(year, month),
        api.getComparison(year, month),
      ]);
      setTransactions(txs);
      setSummary(summaryData);
      setTrend(trendData);
      setBudgetProgress(budgetData);
      setComparison(comparisonData);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} — is the backend running on http://localhost:8000?`
          : "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, [year, month, search, category]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAdd = async (tx: NewTransaction) => {
    await api.createTransaction(tx);
    await loadAll();
  };

  const handleDelete = async (id: number) => {
    await api.deleteTransaction(id);
    await loadAll();
  };

  const handleSetBudget = async (cat: string, limit: number) => {
    await api.setBudget({ category: cat, monthly_limit: limit, month, year });
    await loadAll();
  };

  const handleDeleteBudget = async (budgetId: number) => {
    await api.deleteBudget(budgetId);
    await loadAll();
  };

  const categories = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.category))).sort(),
    [transactions]
  );

  const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];

  return (
    <div className="app">
      <div className="app-header">
        <h1>💰 Personal Finance Dashboard</h1>
        <div className="month-picker">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <SummaryCards summary={summary} />

      <div className="charts-grid">
        <div className="card">
          <h2>Spending by Category</h2>
          <CategoryPieChart data={summary?.by_category ?? []} />
        </div>
        <div className="card">
          <h2>Spending Trend (6 months)</h2>
          <SpendingTrendChart data={trend} />
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <h2>Budgets</h2>
          <BudgetProgressList items={budgetProgress} onSetBudget={handleSetBudget} onDeleteBudget={handleDeleteBudget} />
        </div>
        <div className="card">
          <h2>Month vs. Last Month</h2>
          <MonthComparisonCard comparison={comparison} />
        </div>
      </div>

      <div className="layout-grid">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2>Add Transaction</h2>
            <TransactionForm onAdd={handleAdd} />
          </div>
          <div className="card">
            <h2>Import CSV</h2>
            <CsvImport onImported={loadAll} />
          </div>
        </div>
        <div className="card">
          <h2>Transactions</h2>
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : (
            <TransactionTable
              transactions={transactions}
              search={search}
              onSearchChange={setSearch}
              category={category}
              onCategoryChange={setCategory}
              categories={categories}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
