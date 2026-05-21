# apps/web

Phase 5 scaffold for the future dedicated web app workspace.

Current state:

- Runtime remains at repository root (`vite`, `src/`, `index.html`).
- `npm run apps:web:dev` delegates to the existing dashboard dev server.

Next migration steps:

1. Move `index.html`, `vite.config.js`, and `src/` into this folder.
2. Keep root-level scripts as compatibility wrappers during transition.
3. Switch CI to build this app entry directly.
