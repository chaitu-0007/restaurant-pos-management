import React, { useEffect, useMemo, useState } from "react";
import { api, money } from "../api.js";

// Menu grid on the left, running order ("cart") on the right.
export default function PosView({ onOrderPlaced }) {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({}); // { menuItemId: qty }
  const [activeCat, setActiveCat] = useState("All");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getMenu()
      .then(setMenu)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menu.map((m) => m.category)));
    return ["All", ...cats];
  }, [menu]);

  const visibleMenu =
    activeCat === "All" ? menu : menu.filter((m) => m.category === activeCat);

  const addToCart = (id) =>
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const decFromCart = (id) =>
    setCart((c) => {
      const next = { ...c };
      if (!next[id]) return next;
      next[id] -= 1;
      if (next[id] <= 0) delete next[id];
      return next;
    });

  const cartLines = Object.entries(cart).map(([id, qty]) => {
    const item = menu.find((m) => m.id === Number(id));
    return { item, qty };
  });
  const total = cartLines.reduce(
    (sum, l) => sum + (l.item ? l.item.price * l.qty : 0),
    0
  );

  const placeOrder = async () => {
    setPlacing(true);
    setError("");
    try {
      const items = Object.entries(cart).map(([id, qty]) => ({
        menu_item_id: Number(id),
        qty,
      }));
      await api.createOrder(items);
      setCart({});
      onOrderPlaced();
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <p className="muted">Loading menu…</p>;

  return (
    <div className="pos-layout">
      <section className="menu-panel">
        <div className="section-head">
          <div>
            <span className="eyebrow">À la carte</span>
            <h2>Our Menu</h2>
          </div>
          <span className="muted">Tap a dish to add it</span>
        </div>
        <div className="cat-filters">
          {categories.map((c) => (
            <button
              key={c}
              className={activeCat === c ? "chip active" : "chip"}
              onClick={() => setActiveCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="menu-grid">
          {visibleMenu.map((item) => (
            <button
              key={item.id}
              className="menu-card"
              onClick={() => addToCart(item.id)}
            >
              <span className="menu-card-cat">{item.category}</span>
              <span className="menu-card-name">{item.name}</span>
              <span className="menu-card-price">{money(item.price)}</span>
              {cart[item.id] ? (
                <span className="menu-card-badge">{cart[item.id]}</span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <aside className="cart-panel">
        <span className="eyebrow">Table Order</span>
        <h2>Current Order</h2>
        {cartLines.length === 0 ? (
          <p className="muted">Tap menu items to build an order.</p>
        ) : (
          <ul className="cart-list">
            {cartLines.map(({ item, qty }) =>
              item ? (
                <li key={item.id} className="cart-row">
                  <div className="cart-row-info">
                    <span className="cart-row-name">{item.name}</span>
                    <span className="cart-row-price">
                      {money(item.price)} each
                    </span>
                  </div>
                  <div className="qty-controls">
                    <button onClick={() => decFromCart(item.id)}>−</button>
                    <span className="qty">{qty}</span>
                    <button onClick={() => addToCart(item.id)}>+</button>
                  </div>
                  <span className="cart-row-total">
                    {money(item.price * qty)}
                  </span>
                </li>
              ) : null
            )}
          </ul>
        )}

        <div className="cart-footer">
          <div className="total-line">
            <span>Total</span>
            <span className="total-amount">{money(total)}</span>
          </div>
          {error && <p className="error">{error}</p>}
          <button
            className="primary-btn"
            disabled={cartLines.length === 0 || placing}
            onClick={placeOrder}
          >
            {placing ? "Placing…" : "Place Order"}
          </button>
          {cartLines.length > 0 && (
            <button className="text-btn" onClick={() => setCart({})}>
              Clear
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
