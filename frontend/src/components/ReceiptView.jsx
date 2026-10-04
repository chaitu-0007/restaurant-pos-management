import React, { useEffect, useState } from "react";
import { api, money } from "../api.js";

const TAX_RATE = 0.08; // 8% demo sales tax shown on the receipt

// Left: list of all orders. Right: printable receipt for the selected order.
export default function ReceiptView({ refreshKey, onChange }) {
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    api
      .getOrders()
      .then((data) => {
        setOrders(data);
        setSelectedId((cur) => cur ?? (data[0] ? data[0].id : null));
      })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const selected = orders.find((o) => o.id === selectedId);

  const markPaid = async () => {
    if (!selected) return;
    try {
      await api.advanceStatus(selected.id, "paid");
      load();
      onChange?.();
    } catch (e) {
      setError(e.message);
    }
  };

  const subtotal = selected ? selected.total : 0;
  const tax = subtotal * TAX_RATE;
  const grand = subtotal + tax;

  return (
    <div className="receipt-layout">
      <aside className="order-list-panel">
        <h2>Orders</h2>
        {error && <p className="error">{error}</p>}
        <ul className="order-list">
          {orders.map((o) => (
            <li
              key={o.id}
              className={
                o.id === selectedId ? "order-list-row active" : "order-list-row"
              }
              onClick={() => setSelectedId(o.id)}
            >
              <span>Order #{o.id}</span>
              <span className={`badge ${o.status}`}>{o.status}</span>
              <span className="order-list-total">{money(o.total)}</span>
            </li>
          ))}
        </ul>
      </aside>

      <section className="receipt-panel">
        {!selected ? (
          <p className="muted">Select an order to view its receipt.</p>
        ) : (
          <div className="receipt">
            <div className="receipt-head">
              <span className="eyebrow">Trattoria · Est. 2024</span>
              <h2>Bella Vista</h2>
              <p className="muted">123 Market Street · (555) 010-2024</p>
              <p className="muted small">
                Order #{selected.id} ·{" "}
                {new Date(selected.created_at).toLocaleString()}
              </p>
            </div>
            <div className="receipt-divider" />
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="r">Qty</th>
                  <th className="r">Price</th>
                  <th className="r">Amount</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((it, i) => (
                  <tr key={i}>
                    <td>{it.name}</td>
                    <td className="r">{it.qty}</td>
                    <td className="r">{money(it.price)}</td>
                    <td className="r">{money(it.price * it.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="receipt-divider" />
            <div className="receipt-totals">
              <div>
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div>
                <span>Tax (8%)</span>
                <span>{money(tax)}</span>
              </div>
              <div className="grand">
                <span>Total</span>
                <span>{money(grand)}</span>
              </div>
            </div>
            <div className="receipt-divider" />
            <div className="receipt-status">
              Status: <span className={`badge ${selected.status}`}>
                {selected.status}
              </span>
            </div>
            <div className="receipt-actions">
              {selected.status !== "paid" ? (
                <button className="primary-btn" onClick={markPaid}>
                  Mark as Paid
                </button>
              ) : (
                <p className="paid-stamp">✓ PAID — Thank you!</p>
              )}
              <button className="text-btn" onClick={() => window.print()}>
                🖨️ Print
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
