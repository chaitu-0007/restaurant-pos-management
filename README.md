# 🍽️ Restaurant POS & Order Management

A complete Point-of-Sale app for a restaurant — take orders, run the kitchen,
print receipts, and watch a live sales dashboard. Everything runs on **one URL**
from a single command. No databases to install, no separate frontend server.

- **Backend:** FastAPI + SQLite (a single file, no server to install)
- **Frontend:** React + Vite + Recharts (built and served by FastAPI)
- **Demo data:** ~22 menu items and 15 orders are loaded automatically the first
  time you run it.

---

## ✅ Prerequisites (install these once)

You only need two free tools. After installing, **close and reopen** any terminal
windows so they're picked up.

1. **Python 3.10 or newer** — https://www.python.org/downloads/
   - On Windows, tick **"Add Python to PATH"** on the first screen of the installer.
2. **Node.js 18 or newer** — https://nodejs.org/ (the "LTS" version is fine).

To check they're installed, open a terminal and run:

```
python --versionsetup.bat
node --version
```

Both should print a version number.

---

## 🚀 Setup — ONE command

1. Unzip this project into a folder (anywhere you like).
2. Double-click **`setup.bat`**, or run it from a terminal:

   ```
   setup.bat
   ```

That's it. The script will automatically:

1. Install the frontend packages and **build** the React app.
2. Create a Python virtual environment and install the backend dependencies.
3. **Seed the demo data** (only on the first run).
4. Start the app.

When you see `Open your browser to: http://localhost:8000`, open that address in
your browser. 🎉

> The first run takes a couple of minutes (it downloads packages). Later runs are
> fast. To stop the app, press **Ctrl + C** in the terminal window.

> 💡 No login is required — this is a staff-facing POS terminal, so it opens
> straight to the order screen.

---

## 👀 What you should see on first launch

The app opens on the **New Order** screen with demo data already loaded:

- **🧾 New Order** — a grid of ~22 menu items across 5 categories (Starters,
  Mains, Sides, Desserts, Drinks). Tap items to add them to the order on the
  right, adjust quantities with **+ / −**, watch the running total, and press
  **Place Order**.
- **👨‍🍳 Kitchen** — about **6 active orders** waiting to be cooked. Each card has a
  button that advances the order through its lifecycle:
  **placed → preparing → served → paid**.
- **💳 Bills / Receipts** — pick any of the 15+ orders to see a printable receipt
  with subtotal, 8% tax, and total. You can **Mark as Paid** or **Print**.
- **📊 Dashboard** — today's revenue (~$330 from the paid demo orders), order
  counts, a **bar chart of top-selling items**, and a **pie chart of orders by
  status**.

Place a new order and you'll see it appear in the Kitchen view and update the
Dashboard — it all shares one live SQLite database.

---

## 🗂️ Project structure

```
Restaurant POS & Order Management/
├── setup.bat              ← the one command you run
├── README.md
├── .gitignore
├── backend/
│   ├── main.py            ← FastAPI app: API + serves the React build
│   ├── database.py        ← SQLite connection
│   ├── models.py          ← MenuItem and Order tables
│   ├── schemas.py         ← request/response shapes
│   ├── seed.py            ← demo data + auto-seed on first run (committed!)
│   ├── requirements.txt   ← pinned Python dependencies
│   └── pos.db             ← SQLite file (created automatically; not committed)
└── frontend/
    ├── package.json       ← pinned JS dependencies
    ├── vite.config.js
    ├── index.html
    └── src/               ← React components (PosView, KitchenView, etc.)
```

---

## 🔌 API reference (for the curious)

All endpoints are under `http://localhost:8000/api`. Interactive docs are
auto-generated at **http://localhost:8000/docs**.

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/api/menu` | List all menu items |
| POST   | `/api/menu` | Create a menu item |
| PUT    | `/api/menu/{id}` | Update a menu item |
| DELETE | `/api/menu/{id}` | Delete a menu item |
| GET    | `/api/orders` | List orders (`?active=true` for kitchen) |
| GET    | `/api/orders/{id}` | Get one order |
| POST   | `/api/orders` | Create an order |
| PATCH  | `/api/orders/{id}/status` | Advance status (or set one explicitly) |
| GET    | `/api/summary/daily` | Today's revenue + top items |

---

## ❓ Troubleshooting

- **"python is not recognized"** — Python isn't on your PATH. Reinstall Python and
  tick *"Add Python to PATH"*, then reopen the terminal.
- **"node is not recognized"** — Install Node.js from https://nodejs.org/ and
  reopen the terminal.
- **Port 8000 already in use** — Something else is using the port. Close it, or
  edit the last line of `setup.bat` to use `--port 8001` and open
  `http://localhost:8001`.
- **Want to start fresh?** — Delete `backend/pos.db` and run `setup.bat` again.
  The demo data will be re-seeded automatically.
