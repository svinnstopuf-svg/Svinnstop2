# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- This is a minimal React app scaffolded with Vite. It tracks purchased food items, their expiry dates, and surfaces quick recipe suggestions based on the items you’ve added. Data is stored locally in the browser via localStorage.
- Node 18+ is required (see README.md).

Common commands (PowerShell)
- Install dependencies: `npm install`
- Start dev server (hot reload): `npm run dev`
- Build production bundle: `npm run build`
- Preview built app locally: `npm run preview`
- Alternate start (same as dev script): `npm run start`
- Linting: not configured in this repo
- Testing: not configured in this repo (no test runner present)

Notes on running
- The Vite dev server binds to all interfaces by default (`--host` is already set in scripts). Port is taken from the `PORT` environment variable if set, otherwise 3000.
- On Replit (if relevant), `.replit` config installs dependencies and runs the dev server.

High-level architecture
- Entry point (React bootstrap)
  - src/main.jsx creates a React root on the `#root` element and renders `<App />` within `<React.StrictMode>`.
- Application component and state
  - src/App.jsx owns the application state for the item list and the add-item form. It persists the item array to localStorage under the key `svinnstop_items` and reloads it on mount.
  - Item IDs are generated with `crypto.randomUUID()` when available, with a timestamp fallback.
  - Items are sorted by `expiresAt` ascending and can be filtered by: all, expiring (≤ 3 days), or expired.
  - Expiry status is computed via a `daysUntil(dateStr)` helper and reflected in UI classes for styling.
  - The add-item form requires `name` and `expiresAt`. `quantity` defaults to 1. Dates are handled as date-input strings.
- Recipe suggestions
  - src/recipes.js exports a small static recipe list and a `suggestRecipes(items)` helper that returns up to three recipes whose ingredient names substring-match any item name (case-insensitive).
- Styling and UI
  - src/styles.css contains a compact, readable dark theme and basic layout classes used by App.jsx.
- Build/dev config
  - vite.config.js enables React via `@vitejs/plugin-react`, sets `server.host = true`, and `server.port = process.env.PORT || 3000`.

Conventions and data model
- localStorage key: `svinnstop_items`
- Item shape: `{ id, name, quantity, purchasedAt, expiresAt }`
- Dates are stored as strings compatible with `<input type="date">`.

What’s not present
- No lint configuration (e.g., ESLint/Prettier) is included.
- No tests or test runner are configured.
- No CI/CD workflows are present.

Pointers for future changes
- If you add linting or tests, include the exact commands under “Common commands” so future agents can run them (e.g., `npm run lint`, `npm test`, and how to run a single test).
- If you introduce API calls or backend services, document environment variables and how to run against local vs. production backends.
