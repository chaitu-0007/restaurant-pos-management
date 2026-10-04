import React, { useEffect, useState } from "react";
import { api, money } from "../api.js";

const NEXT_LABEL = {
  placed: "Start Preparing →",
  preparing: "Mark Served →",
  served: "Mark Paid →",
};

const STATUS_CLASS = {
  placed: "badge placed",
  preparing: "badge preparing",
  served: "badge served",
  paid: "badge paid",
};

function timeAgo(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  return `${mins} mins ago`;
}

// Live board of active orders (placed + preparing). Each card advances status.
export default function KitchenView({ refreshKey, onChange }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    api
      .getOrders(true)
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Auto-refresh the kitchen board every 10s so it feels live.
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const advance = async (order) => {
    try {
      await api.advanceStatus(order.id);
      load();
      onChange?.();
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <p className="muted">Loading kitchen…</p>;

  return (
    <div className="kitchen">
      <div className="section-head">
        <div>
          <span className="eyebrow">Kitchen Pass</span>
          <h2>Active Orders</h2>
        </div>
        <span className="muted">{orders.length} in progress</span>
      </div>
      {error && <p className="error">{error}</p>}
      {orders.length === 0 ? (
        <div className="empty-state">
          🎉 No active orders. The kitchen is all caught up!
        </div>
      ) : (
        <div className="order-grid">
          {orders.map((o) => (
            <div key={o.id} className={`order-card is-${o.status}`}>
              <div className="order-card-head">
                <span className="order-id">Order #{o.id}</span>
                <span className={STATUS_CLASS[o.status]}>{o.status}</span>
              </div>
              <span className="muted small">{timeAgo(o.created_at)}</span>
              <ul className="order-items">
                {o.items.map((it, i) => (
                  <li key={i}>
                    <span className="item-qty">{it.qty}×</span> {it.name}
                  </li>
                ))}
              </ul>
              <div className="order-card-foot">
                <span className="order-total">{money(o.total)}</span>
                <button className="primary-btn small" onClick={() => advance(o)}>
                  {NEXT_LABEL[o.status]}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
