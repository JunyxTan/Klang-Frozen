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
