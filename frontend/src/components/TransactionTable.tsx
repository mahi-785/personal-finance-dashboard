import { Transaction } from "../services/api";

function formatMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TransactionTable({
  transactions,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  onDelete,
}: {
  transactions: Transaction[];
  search: string;
  onSearchChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  categories: string[];
  onDelete: (id: number) => void;
}) {
  return (
    <div>
      <div className="filters">
        <input
          placeholder="Search description…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">No transactions found.</div>
      ) : (
        <table className="tx-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{formatDate(tx.date)}</td>
                <td>{tx.description}</td>
                <td>
                  <span className="category-pill">{tx.category}</span>
                </td>
                <td className={`amount ${tx.type}`}>
                  {tx.type === "income" ? "+" : "-"}
                  {formatMoney(tx.amount)}
                </td>
                <td>
                  <button className="delete-btn" onClick={() => onDelete(tx.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
