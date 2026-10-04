import React, { useState } from "react";
import PosView from "./components/PosView.jsx";
import KitchenView from "./components/KitchenView.jsx";
import ReceiptView from "./components/ReceiptView.jsx";
import DashboardView from "./components/DashboardView.jsx";

const TABS = [
  { id: "pos", label: "🧾 New Order" },
  { id: "kitchen", label: "👨‍🍳 Kitchen" },
  { id: "receipts", label: "💳 Bills / Receipts" },
  { id: "dashboard", label: "📊 Dashboard" },
];

export default function App() {
  const [tab, setTab] = useState("pos");
  // Bump this to force child views to re-fetch after an order is created.
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">🍽️</span>
          <div>
            <h1>Bella Vista</h1>
            <p>Trattoria · Est. 2024</p>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "tab active" : "tab"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {tab === "pos" && (
          <PosView
            onOrderPlaced={() => {
              refresh();
              setTab("kitchen");
            }}
          />
        )}
        {tab === "kitchen" && (
          <KitchenView refreshKey={refreshKey} onChange={refresh} />
        )}
        {tab === "receipts" && (
          <ReceiptView refreshKey={refreshKey} onChange={refresh} />
        )}
        {tab === "dashboard" && <DashboardView refreshKey={refreshKey} />}
      </main>
    </div>
  );
}
