# Active Tasks

## Current Priorities

- Continue replacing benchmark-only relocation sections with official 2022-2026 municipal, operator, regional, or national sources.
- Keep the expansion-wave city data modular while preserving the public export contract consumed by the rest of `src/data/`.
- Preserve the local Rigour shim and document why it exists when tooling flags it as unused.

## Remaining Quality Debt

- Large authored files still remain in `services/tracker_service.py`, `tests/test_services.py`, `src/components/familyComparisonBoardSections.jsx`, `src/data/strategicBalanceMatrix.js`, and `src/styles/relocation-board.css`.
- Some Rigour Python naming and Tkinter warnings do not line up cleanly with the current files on disk and should be treated carefully before any broad rename pass.
- Generated artifact trees can distort repo-wide scans if stale build output is left in place.

## Validation Checklist

- Run `npm run dashboard:build` after relocation dashboard data changes.
- Re-run Rigour after documentation or metadata cleanup to confirm whether the targeted debt actually moved.
- Prefer narrow checks before broader repo scans whenever a change only affects one slice.