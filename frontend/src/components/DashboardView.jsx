import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { api, money } from "../api.js";

const STATUS_COLORS = {
  placed: "#cf9b3f",
  preparing: "#4a6d8c",
  served: "#8c5a7a",
  paid: "#4f7a52",
};

export default function DashboardView({ refreshKey }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getDailySummary()
      .then(setSummary)
      .catch((e) => setError(e.message));
  }, [refreshKey]);

  if (error) return <p className="error">{error}</p>;
  if (!summary) return <p className="muted">Loading dashboard…</p>;

  const statusData = Object.entries(summary.status_counts)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  return (
    <div className="dashboard">
      <div className="section-head">
        <div>
          <span className="eyebrow">Service Report</span>
          <h2>Today's Sales</h2>
        </div>
        <span className="muted">{summary.date}</span>
      </div>

      <div className="stat-cards">
        <div className="stat-card feature">
          <span className="stat-label">Revenue (paid)</span>
          <span className="stat-value">{money(summary.revenue)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Paid Orders</span>
          <span className="stat-value">{summary.paid_orders}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Orders</span>
          <span className="stat-value">{summary.total_orders}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg. Order</span>
          <span className="stat-value">
            {money(
              summary.paid_orders ? summary.revenue / summary.paid_orders : 0
            )}
          </span>
        </div>
      </div>

      <div className="charts">
        <div className="chart-card">
          <h3>Top Selling Items</h3>
          {summary.top_items.length === 0 ? (
            <p className="muted">No sales yet today.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={summary.top_items}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#8c7a64" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fontSize: 12, fill: "#4b3d2f" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(184,137,63,0.08)" }}
                  formatter={(v, n) =>
                    n === "qty" ? [`${v} sold`, "Qty"] : v
                  }
                />
                <Bar
                  dataKey="qty"
                  fill="#b8893f"
                  radius={[0, 6, 6, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Orders by Status</h3>
          {statusData.length === 0 ? (
            <p className="muted">No orders yet today.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(d) => `${d.name} (${d.value})`}
                  isAnimationActive={false}
                >
                  {statusData.map((d) => (
                    <Cell
                      key={d.name}
                      fill={STATUS_COLORS[d.name] || "#9ca3af"}
                    />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="chart-card">
        <h3>Top Items Detail</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th className="r">Qty Sold</th>
              <th className="r">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {summary.top_items.map((it) => (
              <tr key={it.name}>
                <td>{it.name}</td>
                <td className="r">{it.qty}</td>
                <td className="r">{money(it.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
