import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { CategoryAmount, TrendPoint } from "../services/api";

const COLORS = ["#4f46e5", "#16a34a", "#f59e0b", "#dc2626", "#0891b2", "#9333ea", "#65a30d", "#db2777"];

function formatMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function CategoryPieChart({ data }: { data: CategoryAmount[] }) {
  if (data.length === 0) {
    return <div className="empty-state">No spending yet this month.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => formatMoney(value)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SpendingTrendChart({ data }: { data: TrendPoint[] }) {
  const chartData = data.map((d) => ({
    label: MONTH_LABELS[d.month - 1],
    total: d.total_spending,
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis fontSize={12} tickFormatter={(v) => formatMoney(v)} width={70} />
        <Tooltip formatter={(value: number) => formatMoney(value)} />
        <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
