import { DashboardSummary } from "../services/api";

function formatMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function SummaryCards({ summary }: { summary: DashboardSummary | null }) {
  if (!summary) return null;

  return (
    <div className="summary-grid">
      <div className="card summary-card expense">
        <div className="label">Total Spending</div>
        <div className="value">{formatMoney(summary.total_spending)}</div>
      </div>
      <div className="card summary-card income">
        <div className="label">Total Income</div>
        <div className="value">{formatMoney(summary.total_income)}</div>
      </div>
      <div className="card summary-card">
        <div className="label">Net</div>
        <div className="value" style={{ color: summary.net >= 0 ? "var(--income)" : "var(--expense)" }}>
          {formatMoney(summary.net)}
        </div>
      </div>
    </div>
  );
}
