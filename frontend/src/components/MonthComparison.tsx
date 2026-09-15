import { MonthComparison } from "../services/api";

function formatMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function MonthComparisonCard({ comparison }: { comparison: MonthComparison | null }) {
  if (!comparison) return null;

  const { current_month, previous_month, percent_change, by_category } = comparison;
  const changedCategories = by_category
    .filter((c) => c.change !== 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 22, fontWeight: 700 }}>{formatMoney(current_month.total_spending)}</span>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>
          vs {formatMoney(previous_month.total_spending)} in {MONTH_NAMES[previous_month.month - 1]}
        </span>
        {percent_change !== null && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: percent_change > 0 ? "var(--expense)" : "var(--income)",
            }}
          >
            {percent_change > 0 ? "↑" : "↓"} {Math.abs(percent_change)}%
          </span>
        )}
      </div>

      {changedCategories.length === 0 ? (
        <div className="empty-state">No spending in either month to compare.</div>
      ) : (
        changedCategories.map((c) => (
          <div
            key={c.category}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              padding: "6px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span>{c.category}</span>
            <span style={{ color: "var(--muted)" }}>
              {formatMoney(c.previous)} → {formatMoney(c.current)}{" "}
              <span style={{ color: c.change > 0 ? "var(--expense)" : "var(--income)", fontWeight: 600 }}>
                ({c.change > 0 ? "+" : ""}
                {formatMoney(c.change)})
              </span>
            </span>
          </div>
        ))
      )}
    </div>
  );
}
