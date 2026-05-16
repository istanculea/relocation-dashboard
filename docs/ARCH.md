# Architecture

## Repository Shape

The repository hosts two separate runtime surfaces:

- Python desktop application under `main.py`, `services/`, `persistence/`, `scrapers/`, and `ui/`
- React relocation dashboard under `src/`

Shared project tooling lives at the repository root, including `package.json`, `requirements*.txt`, `build_exe.ps1`, `packaging/`, and the local Rigour shim in `tools/rigour-cli/`.

## Desktop Application Layers

- `ui/` is the presentation layer. It should render state, dispatch user actions, and poll background events, but it should not perform database writes or retailer detection directly.
- `services/` owns application workflows. `OfferTrackerService` handles watchlist and dashboard orchestration, `BackgroundRefreshService` owns the thread boundary for scraping, and catalog or notification flows remain service-level concerns.
- `persistence/` owns SQLite composition. Write repositories, read queries, schema initialization, and settings storage are intentionally split instead of kept in one adapter.
- `scrapers/` is the retailer integration layer. Each scraper or importer encapsulates source-specific extraction rules.

## Relocation Dashboard Layers

- `src/data/` holds authored datasets, audit metadata, verification helpers, and city assembly logic.
- `src/components/` renders the dashboard views from the normalized data surfaces.
- `src/styles/` and `src/styles.css` define the authored presentation layer.
- `src/data/cityExpansionWave/` now splits expansion-wave construction into shared helpers, profile definitions, an assembler, and regional city configuration modules.

## Verification Flow

- Authored city source metadata is aggregated through `src/data/citySourceMeta.js`.
- Verification filtering is centralized in `src/data/sourceSelection.js`.
- UI strict cards in `src/components/verificationPanelShared.jsx` display verified entries first and fall back to modeled gap messaging only when verified evidence is missing.

## Build Outputs

- The relocation dashboard build writes static assets to `dist/relocation-dashboard/`.
- Desktop packaging writes the executable bundle under `dist/PriceDashboard/`.
- Build output is generated artifact space and should not be treated as authored source when evaluating maintainability debt.