# Klang Frozen

React + Vite single-page app for Klang Frozen catalogue and admin pages.

## Local development

```bash
npm install
npm run dev
```

## Deploy to Netlify (including `/catalogue` route)

This app uses client-side routing (`/`, `/catalogue`, `/admin`).
To make direct links like `https://klang-frozen.netlify.app/catalogue` work after refresh, Netlify must rewrite all paths to `index.html`.

This repository already includes `netlify.toml` with:
- build command: `npm run build`
- publish directory: `dist`
- SPA redirect rule: `/* -> /index.html` (200)

### Option A: Deploy from GitHub

1. Push this repo to GitHub.
2. In Netlify, click **Add new site** → **Import an existing project**.
3. Choose your Git provider and repository.
4. Build settings should be auto-detected from `netlify.toml`.
5. Click **Deploy site**.

### Option B: Deploy with Netlify CLI

```bash
npm install
npm run build
npx netlify deploy --prod --dir=dist
```

## Verify deployment

After deploy, test these URLs directly in a new tab:
- `/`
- `/catalogue`
- `/admin`

If each route loads instead of showing 404, the redirect is configured correctly.

## Product Data Saved In GitHub

Products are now sourced from `data/products.json` in this repository and updated through a Netlify Function that commits changes back to GitHub.

Set these Netlify environment variables:

- `GITHUB_TOKEN`: GitHub Personal Access Token with `contents:write` access to the repo.
- `GITHUB_OWNER`: repo owner, e.g. `JunyxTan`
- `GITHUB_REPO`: repo name, e.g. `Klang-Frozen`
- `GITHUB_BRANCH`: branch to update (default: `main`)
- `GITHUB_PRODUCTS_PATH`: file path for products JSON (default: `data/products.json`)

Notes:
- Product reads and writes are handled by `/.netlify/functions/products` using GitHub Contents API with file SHA checks.
- Without these variables, product requests fail with a configuration error (no frontend secret exposure).
- Once configured, product create/update/delete in Admin commits directly to the repo file so all devices load the same product list after refresh.
