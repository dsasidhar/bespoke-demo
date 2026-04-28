# Bespoke — Supply Chain Visibility Prototype

Design playground for the **Bespoke × Walmart** supply chain visibility portal. Built as a UX
demo with fake data so we can iterate on direction with the Walmart team before May 5/15.

The landing page (`/`) is a shell of **design directions**. Direction 1 — **Pipeline Control
Tower** — is the first one ready to walk through.

## Run locally

```bash
npm install
npm run dev
# open http://localhost:5173/
```

## Deploy to GitHub Pages

1. Push this repo to GitHub (e.g., `your-org/bespoke`).
2. In GitHub → Settings → Pages, set the source to the `gh-pages` branch.
3. From your machine:
   ```bash
   # If the repo name is NOT "bespoke", set VITE_BASE to your repo path:
   VITE_BASE=/your-repo-name/ npm run build
   npx gh-pages -d dist -t true
   ```
   Or use the bundled scripts (assumes repo name = `bespoke`):
   ```bash
   npm run deploy
   ```
4. Site will be live at `https://<user>.github.io/<repo-name>/`.

The app uses **HashRouter**, so deep links work without GH Pages 404 fallback.

## Project layout

```
src/
  pages/
    IndexPage.tsx       — design directions launcher
    Direction1.tsx      — Pipeline Control Tower
  components/d1/        — components for Direction 1
    TopBar.tsx
    SideNav.tsx
    Filters.tsx
    KpiCards.tsx
    PipelineRibbon.tsx  — 7-node flow visualization
    InventoryChart.tsx  — recharts inventory trajectory
    WeeklyPlanning.tsx  — week-by-week planning grid (mirrors PDF spec)
    AggregateHeatmap.tsx— DC × week heatmap
    InsightsPanel.tsx   — "what changed this week" cards
  data/
    skus.ts        — 10 SKUs (8 chocolate + 2 gummy)
    dcs.ts         — 12 representative McLane / Walmart DCs
    segments.ts    — 13 supply-chain segments
    inventory.ts   — deterministic plan generator (per SKU × DC)
    aggregate.ts   — network-wide rollups for KPIs and heatmap
    insights.ts    — handcrafted insight cards
    rng.ts         — seedable PRNG (Mulberry32)
  types.ts
  lib/utils.ts     — formatters, color bands
```

## Story baked into the demo

Default selection (`Swiss Dark 70%` × `DC 6020 Cleburne, TX`) shows the headline scenario from
the intro call: a DC that **looked healthy last snapshot but is now projected OOS in 4 weeks**
because a sailing slipped. Toggling SKU/DC reveals other DCs and SKUs with realistic — but
fully fake — supply chain dynamics.

## Tech

- Vite 5 · React 18 · TypeScript
- Tailwind CSS v3
- Recharts for charts
- Lucide for icons
- HashRouter (GH Pages friendly)

> All data in this repo is illustrative and not connected to NetSuite, McLane, or Walmart Retail Link.
