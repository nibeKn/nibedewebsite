# Nibe — personal portfolio

A bilingual portfolio for front-end design and development. The site presents two personal projects, explains the design decisions behind them, and uses animated cat scenes against photographic backgrounds. The contact section supports direct delivery through Cloudflare Pages Functions, with Gmail, Outlook, and copyable-message alternatives.

## Getting started

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

The development server runs at `http://127.0.0.1:5175/`.

```sh
npm test
npm run format:check
npm run build
npm run preview
```

`npm run build` creates the static site in `dist/`. The preview server runs at `http://127.0.0.1:4175/`. Deploy this repository as a Cloudflare Pages project with build command `npm run build`, output directory `dist`, and an empty deploy command. The `functions/` directory must be included at the project root so Pages publishes the `/api/contact` endpoint.

GitHub Actions runs the formatting check, tests, and production build on pushes and pull requests.

## How it works

- Vue 3 components and Vite build tooling.
- English and Spanish content in `src/data/content.js`. The initial language follows the browser language for Spanish and English, and defaults to English for other languages. A manual choice persists in local storage.
- Cat animations use poster images before playback. Videos load when their scenes become visible and pause when the scene or browser tab is hidden. Reduced-motion preferences disable automatic playback.
- Project preview videos load on request. Each project also has a live-site link, a source-code link, and an expandable description of its challenge, decisions, and scope.
- The contact form sends through a Pages Function after server-side Turnstile verification. When sending is not configured, visitors can open a prepared message in Gmail or Outlook or copy it. Incoming mail to `contact@nibe.dev` is handled separately by Cloudflare Email Routing.

## Content and assets

Project descriptions are based on the public repositories for [Nivel Retro](https://github.com/nibedev/Tienda-Nivel-Retro) and [Ñamster Café](https://github.com/nibedev/Namster-Cafe). Both are personal showcase projects. Their individual descriptions clarify which commerce, booking, or form interactions are demonstrations.
