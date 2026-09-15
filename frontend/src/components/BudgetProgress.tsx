import { useState } from "react";
import { BudgetProgress as BudgetProgressType } from "../services/api";

function formatMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function BudgetRow({
  item,
  onSetBudget,
  onDeleteBudget,
}: {
  item: BudgetProgressType;
  onSetBudget: (category: string, limit: number) => Promise<void>;
  onDeleteBudget: (budgetId: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.monthly_limit?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const hasBudget = item.monthly_limit !== null;
  const percent = item.percent_used ?? 0;
  const exceeded = item.exceeded_by !== null;
  const barColor = exceeded ? "var(--expense)" : percent > 85 ? "#f59e0b" : "var(--accent)";

  const handleSave = async () => {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed <= 0) return;
    setSaving(true);
    try {
      await onSetBudget(item.category, parsed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{item.category}</span>
        {editing ? (
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="number"
              min="0"
              step="1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={{ width: 80, padding: "3px 6px", borderRadius: 6, border: "1px solid var(--border)" }}
            />
            <button className="primary" style={{ padding: "4px 8px", fontSize: 12 }} onClick={handleSave} disabled={saving}>
              Save
            </button>
          </span>
        ) : (
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            {formatMoney(item.spent)}
            {hasBudget ? ` / ${formatMoney(item.monthly_limit!)}` : ""}{" "}
            <button
              className="delete-btn"
              style={{ marginLeft: 6 }}
              onClick={() => {
                setValue(item.monthly_limit?.toString() ?? "");
                setEditing(true);
              }}
            >
              {hasBudget ? "Edit" : "Set budget"}
            </button>
            {hasBudget && item.budget_id !== null && (
              <button className="delete-btn" style={{ marginLeft: 6 }} onClick={() => onDeleteBudget(item.budget_id!)}>
                Remove
              </button>
            )}
          </span>
        )}
      </div>

      {hasBudget && (
        <>
          <div style={{ background: "#f1f2f6", borderRadius: 999, height: 10, overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.min(percent, 100)}%`,
                background: barColor,
                height: "100%",
                borderRadius: 999,
                transition: "width 0.3s",
              }}
            />
          </div>
          <div style={{ fontSize: 12, color: exceeded ? "var(--expense)" : "var(--muted)", marginTop: 3 }}>
            {exceeded
              ? `Budget exceeded by ${formatMoney(item.exceeded_by!)}`
              : `${percent}% used — ${formatMoney(item.remaining!)} remaining`}
          </div>
        </>
      )}
    </div>
  );
}

export default function BudgetProgressList({
  items,
  onSetBudget,
  onDeleteBudget,
}: {
  items: BudgetProgressType[];
  onSetBudget: (category: string, limit: number) => Promise<void>;
  onDeleteBudget: (budgetId: number) => Promise<void>;
}) {
  if (items.length === 0) {
    return <div className="empty-state">No spending yet this month.</div>;
  }
  return (
    <div>
      {items.map((item) => (
        <BudgetRow key={item.category} item={item} onSetBudget={onSetBudget} onDeleteBudget={onDeleteBudget} />
      ))}
    </div>
  );
}
