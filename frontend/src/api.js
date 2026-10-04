// Tiny fetch wrapper. All paths are relative because FastAPI serves both the
// API and this app from the same origin/port.
const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Menu
  getMenu: () => request("/menu"),
  createMenuItem: (data) =>
    request("/menu", { method: "POST", body: JSON.stringify(data) }),
  updateMenuItem: (id, data) =>
    request(`/menu/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMenuItem: (id) => request(`/menu/${id}`, { method: "DELETE" }),

  // Orders
  getOrders: (active = false) =>
    request(`/orders${active ? "?active=true" : ""}`),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (items) =>
    request("/orders", { method: "POST", body: JSON.stringify({ items }) }),
  advanceStatus: (id, status = null) =>
    request(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Summary
  getDailySummary: () => request("/summary/daily"),
};

export const money = (n) => `$${Number(n).toFixed(2)}`;
