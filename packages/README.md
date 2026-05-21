# packages

Phase 5 shared package graph bridge.

These package folders currently re-export runtime modules from `src/platform/*`.
This enables incremental migration from app-local imports to package-level imports
without a risky big-bang move.

Current package surfaces:

- domain
- verification
- graph
- forecasting
- simulation
- scoring
- narratives
- maps
- exports
- shared
- ui (scaffold)
