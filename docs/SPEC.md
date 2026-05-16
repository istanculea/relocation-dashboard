# Product Specification

## Scope

This workspace contains two deliverables that share one repository:

1. A local desktop application for tracking PC component prices across supported retailers.
2. A standalone React dashboard for comparing family relocation options across European cities.

Both products are expected to stay buildable from the repository root and to keep source-backed data or clearly labeled modeled assumptions.

## Desktop Tracker Requirements

- Track product URLs from supported retailers and persist watchlist state locally in SQLite.
- Run Playwright scraping off the UI thread so the desktop interface remains responsive.
- Surface latest prices, price history, best-offer comparisons, refresh failures, and notification events.
- Support catalog import workflows before a product is promoted into the tracked watchlist.
- Keep retailer-specific scraping rules isolated from application workflow code.

## Relocation Dashboard Requirements

- Build with Vite from the repository root through `npm run dashboard:build`.
- Keep city comparisons source-conscious: verified sources must stay inside the 2022-2026 verification window.
- Distinguish verified, mixed, and modeled sections in the UI instead of flattening everything into one confidence level.
- Preserve the expansion-wave city export contract consumed by the aggregated data modules.
- Prefer official municipal, operator, regional, or national sources when replacing benchmark-only sections.

## Data Quality Rules

- Modeled sections must remain explicitly labeled as modeled.
- Benchmark sources may be used as comparison anchors, but they must not be presented as strict verified facts.
- Verified source entries should carry `verifiedAt` plus either `strictLines`, `snapshotValue`, or a concrete note.
- Generated build output is disposable; authored source files remain the system of record.

## Build And Runtime Entry Points

- Desktop app entry: `python main.py`
- Desktop packaging: `./build_exe.ps1`
- Dashboard dev server: `npm run dashboard:dev`
- Dashboard production build: `npm run dashboard:build`