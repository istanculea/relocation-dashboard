# Engineering Decisions

## Decision 1: Keep The Desktop App Layered

- Status: active
- Decision: UI code stays presentation-only; database writes, refresh orchestration, and retailer logic belong in services and persistence modules.
- Why: this keeps the CustomTkinter surface smaller and makes background refresh behavior testable.

## Decision 2: Keep Catalog Import Separate From The Watchlist

- Status: active
- Decision: imported retailer catalog items remain searchable inventory until the user explicitly promotes them into tracking.
- Why: this avoids mixing scraped catalog breadth with user watchlist intent.

## Decision 3: Preserve The Local Rigour Shim

- Status: active
- Decision: keep `rigour-cli-shim` as a local file-based dev dependency.
- Why: the upstream `rigour` package does not expose a working bin entry for this workspace flow, while the local shim keeps Rigour initialization usable under the current npm toolchain.

## Decision 4: Keep Verification Window Logic Centralized

- Status: active
- Decision: verified relocation sources must pass the 2022-2026 window check in `src/data/sourceSelection.js`.
- Why: the dashboard needs one consistent rule for strict verified snapshots instead of city-by-city exceptions.

## Decision 5: Split Expansion-Wave Data By Responsibility

- Status: active
- Decision: expansion-wave authored data is separated into helpers, profiles, assembler logic, and regional config modules while preserving the original barrel exports.
- Why: the original monolith had become difficult to maintain and had started showing file-size quality debt.