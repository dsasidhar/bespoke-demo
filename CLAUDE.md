# CLAUDE.md

Project context for Claude Code sessions in this repo.

## Read first

Before answering questions about product scope, the DTP spec, or what's in the demo, read **`knowledge/`** (gitignored, local-only):

- `knowledge/README.md` — index + Granola links
- `knowledge/01-meeting-bespoke-supply-chain-visibility.md` — 2026-04-24 kickoff
- `knowledge/02-meeting-bespoke-meeting-2.md` — 2026-04-26 deeper scope
- `knowledge/03-dtp-schemes-spec.md` — Bob's xlsx, fully extracted
- `knowledge/source-files/` — original `DTP Schemes.{xlsx,pdf}`

That folder is the source of truth for product/UX decisions. Don't ask the user to re-explain context that lives there — open the file.

## What this repo is

Vite + React 18 + TS prototype for the **Bespoke × Walmart** supply-chain visibility portal. V0 is a UX demo with **fake data** (no NetSuite/McLane/Retail Link). Audience: Walmart category managers and Bob (Bespoke CFO). Demo windows: 5/5, 5/15–16, 5/19.

## Conventions

- One canonical entity name: **McLane** (any "McLean" in transcripts is a typo).
- 13 supply-chain segments per `knowledge/03-dtp-schemes-spec.md` Sheet 5 are canonical.
- The Planning View numbers in the spec are Bob's example — match them when telling the headline "looks healthy now, OOS in 4 weeks" story.
- App uses HashRouter (GH Pages). Don't switch to BrowserRouter.

## Commands

- `npm run dev` — local dev server
- `npm run build` — TypeScript check + Vite build
- `npm run lint` — eslint
- `npm run deploy` — gh-pages publish
