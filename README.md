# relocation-dashboard

Static project site for the `relocation-dashboard` repository.

## Live URL

After GitHub Pages is enabled and the workflow succeeds, the site is published at:

`https://istanculea.github.io/relocation-dashboard`

## Site files

- `/index.html` — landing/dashboard shell
- `/assets/styles.css` — page styling
- `/assets/app.js` — small client-side enhancements

All links and asset references use relative paths so the site works correctly under the project path `/relocation-dashboard`.

## GitHub Pages deployment

Deployment is handled by `.github/workflows/deploy-pages.yml`:

1. Triggers on pushes to `main` or `master` and by manual dispatch.
2. Uploads the repository content as the Pages artifact.
3. Deploys it using `actions/deploy-pages`.

## How to update the site

1. Edit `index.html` and assets in `/assets`.
2. Commit and push changes.
3. Wait for the **Deploy static site to GitHub Pages** workflow to complete.

## Repository owner follow-up (one-time)

No manual Pages setup is required. The deploy workflow uses `actions/configure-pages` with automatic enablement, so Pages is initialized from CI on first run.
