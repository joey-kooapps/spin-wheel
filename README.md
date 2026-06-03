# Spin Wheel

A colorful, dark themed spin-wheel app built with Vite, React, and TypeScript. The app is fully client-side and deploys as static files on GitHub Pages.

## Requirements

- Node.js 22 or newer is recommended.
- npm is used for dependency installation and scripts.

## Setup

Install dependencies:

```sh
npm install
```

## Run Locally

Start the Vite dev server:

```sh
npm run dev
```

Because the production app is hosted under the GitHub Pages repo path, Vite uses this base URL:

```txt
/spin-wheel/
```

Open the local URL Vite prints in the terminal. It will usually be:

```txt
http://localhost:5173/spin-wheel/
```

## Test

Run the full test suite once:

```sh
npm run test:run
```

Run tests in watch mode while developing:

```sh
npm test
```

The tests cover core data utilities, wheel winner math, reducer behavior, and key UI flows.

## Build

Create a production build:

```sh
npm run build
```

This runs TypeScript checks first, then writes the static site to:

```txt
dist/
```

The `dist/` folder is generated output and should not be committed.

## Preview Production Build

After building, preview the generated site locally:

```sh
npm run preview
```

Open the preview URL at the `/spin-wheel/` path.

## Deploy

Deployment is handled by GitHub Actions in:

```txt
.github/workflows/pages.yml
```

The workflow runs when code is pushed to `main` or when it is triggered manually from the GitHub Actions tab.

The deploy flow is:

1. Install dependencies with `npm ci`.
2. Build the app with `npm run build`.
3. Upload the `dist/` folder as a GitHub Pages artifact.
4. Deploy the artifact to GitHub Pages.

The expected production URL is:

```txt
https://joey-kooapps.github.io/spin-wheel/
```

In the repository settings, GitHub Pages should be configured to use GitHub Actions as the source.

## Project Structure

```txt
index.html              Vite entry HTML
src/main.tsx            React mount point
src/App.tsx             App orchestration and state wiring
src/components/         UI components
src/state/              Reducer and localStorage persistence
src/utils/              Data and wheel math helpers
src/test/               Test setup and browser API mocks
vite.config.ts          Vite build config with /spin-wheel/ base
vitest.config.ts        Vitest test config
.github/workflows/      GitHub Pages deploy workflow
```

## Data Storage

The app stores browser-local data under:

```txt
spin-wheel:v2
```

Data stays in the current browser only. JSON import/export is available for moving datasets between browsers or machines.

## Useful Commands

```sh
npm install       # install dependencies
npm run dev       # start local development server
npm test          # run tests in watch mode
npm run test:run  # run tests once
npm run build     # type-check and build production files
npm run preview   # preview the production build locally
```
