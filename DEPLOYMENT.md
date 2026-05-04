# Space Fishing Deployment

## Repository

- GitHub repo: `git@github.com:greedster/space-fishing.git`
- Expected GitHub Pages URL: `https://greedster.github.io/space-fishing/`

## Local Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build locally:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## GitHub Pages

The Vite build uses a relative base path (`./`) so generated JS/CSS/assets resolve from the current document path. This works on the GitHub Pages project URL and is friendlier to Discord Activity URL mapping/proxy paths than absolute `/space-fishing/` asset URLs.

Static assets in `public/` should be referenced through Vite's base URL, for example `import.meta.env.BASE_URL`, so they resolve both locally, under `/space-fishing/`, and inside Discord Activity path mappings.

Deployment is handled by `.github/workflows/deploy-pages.yml`. It runs on pushes to `main`, installs dependencies with `npm ci`, builds the Vite app, uploads `dist`, and deploys it through GitHub Pages Actions.

In GitHub, check:

```text
GitHub repo -> Settings -> Pages -> Source should be GitHub Actions
```

## Initialize And Push

If this folder has not already been initialized as a Git repository, run:

```bash
git init
git add .
git commit -m "Initial Space Fishing prototype"
git branch -M main
git remote add origin git@github.com:greedster/space-fishing.git
git push -u origin main
```

If `origin` already exists, confirm it first:

```bash
git remote -v
```

Then update it only if needed:

```bash
git remote set-url origin git@github.com:greedster/space-fishing.git
```

## Save Data Note

The current game uses browser `localStorage` for saves. Each tester has their own browser-local save data, and saves are not shared between devices, browsers, or domains.
