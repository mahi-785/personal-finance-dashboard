import { useState } from "react";
import { NewTransaction, TransactionType } from "../services/api";

const CATEGORIES = [
  "Food",
  "Transportation",
  "Shopping",
  "Housing",
  "Entertainment",
  "Utilities",
  "Health",
  "Income",
  "Other",
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function TransactionForm({
  onAdd,
}: {
  onAdd: (tx: NewTransaction) => Promise<void>;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(todayStr());
  const [type, setType] = useState<TransactionType>("expense");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onAdd({ description: description.trim(), amount: parsedAmount, category, date, type });
      setDescription("");
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Chipotle"
        />
      </div>

      <div className="field">
        <label htmlFor="amount">Amount</label>
        <input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="14.50"
        />
      </div>

      <div className="field">
        <label htmlFor="category">Category</label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="date">Date</label>
        <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="field">
        <label>Type</label>
        <div className="type-toggle">
          <label>
            <input
              type="radio"
              name="type"
              checked={type === "expense"}
              onChange={() => setType("expense")}
            />
            Expense
          </label>
          <label>
            <input
              type="radio"
              name="type"
              checked={type === "income"}
              onChange={() => setType("income")}
            />
            Income
          </label>
        </div>
      </div>

      <button className="primary" type="submit" disabled={submitting}>
        {submitting ? "Adding…" : "Add Transaction"}
      </button>
    </form>
  );
}
