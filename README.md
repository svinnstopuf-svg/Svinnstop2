# Svinnstop

A simple React (Vite) app to track purchased food items, their expiry dates, and see quick recipe suggestions.

## Run on Replit (no Nix)
- Configuration (gear near Run):
  - Install: `npm install`
  - Run: `npm run dev -- --host 0.0.0.0 --port $PORT`
- Or create a `.replit` file (already included) with a run command that installs and starts Vite.
- First run may take 1–3 minutes to install dependencies.

## Run locally (Node 18+)
- npm install
- npm run dev

## Features
- Add items with name, quantity, purchase date, and expiry date
- View items sorted by soonest expiry, with clear status (expired/expiring)
- Filter by all, expiring (≤3 days), or expired
- Recipe suggestions based on your items
- Data persistence via localStorage
