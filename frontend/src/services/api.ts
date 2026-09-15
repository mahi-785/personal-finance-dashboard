const API_BASE = "http://localhost:8000";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
}

export type NewTransaction = Omit<Transaction, "id">;

export interface CategoryAmount {
  category: string;
  amount: number;
}

export interface DashboardSummary {
  year: number;
  month: number;
  total_spending: number;
  total_income: number;
  net: number;
  by_category: CategoryAmount[];
}

export interface TrendPoint {
  year: number;
  month: number;
  total_spending: number;
}

export interface Budget {
  id: number;
  category: string;
  monthly_limit: number;
  month: number;
  year: number;
}

export interface BudgetProgress {
  category: string;
  budget_id: number | null;
  monthly_limit: number | null;
  spent: number;
  remaining: number | null;
  percent_used: number | null;
  exceeded_by: number | null;
}

export interface MonthComparisonCategory {
  category: string;
  current: number;
  previous: number;
  change: number;
}

export interface MonthComparison {
  current_month: { year: number; month: number; total_spending: number };
  previous_month: { year: number; month: number; total_spending: number };
  percent_change: number | null;
  by_category: MonthComparisonCategory[];
}

export interface ImportError {
  row: number;
  error: string;
  data: Record<string, string>;
}

export interface ImportResult {
  imported: number;
  failed: number;
  errors: ImportError[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Request failed (${res.status}): ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface TransactionFilters {
  search?: string;
  category?: string;
  type?: TransactionType;
  year?: number;
  month?: number;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") usp.set(key, String(value));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

function asQueryParams(filters: TransactionFilters): Record<string, string | number | undefined> {
  return { ...filters };
}

export const api = {
  listTransactions: (filters: TransactionFilters = {}) =>
    request<Transaction[]>(`/transactions${buildQuery(asQueryParams(filters))}`),

  createTransaction: (tx: NewTransaction) =>
    request<Transaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(tx),
    }),

  deleteTransaction: (id: number) =>
    request<void>(`/transactions/${id}`, { method: "DELETE" }),

  getSummary: (year: number, month: number) =>
    request<DashboardSummary>(`/dashboard/summary${buildQuery({ year, month })}`),

  getTrend: (year: number, month: number, monthsBack = 6) =>
    request<TrendPoint[]>(`/dashboard/trend${buildQuery({ year, month, months_back: monthsBack })}`),

  getComparison: (year: number, month: number) =>
    request<MonthComparison>(`/dashboard/comparison${buildQuery({ year, month })}`),

  getBudgetProgress: (year: number, month: number) =>
    request<BudgetProgress[]>(`/dashboard/budget-progress${buildQuery({ year, month })}`),

  listBudgets: (year: number, month: number) =>
    request<Budget[]>(`/budgets${buildQuery({ year, month })}`),

  setBudget: (budget: { category: string; monthly_limit: number; month: number; year: number }) =>
    request<Budget>("/budgets", {
      method: "POST",
      body: JSON.stringify(budget),
    }),

  deleteBudget: (id: number) => request<void>(`/budgets/${id}`, { method: "DELETE" }),

  importCsv: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/transactions/import`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Import failed (${res.status}): ${body}`);
    }
    return res.json();
  },
};
