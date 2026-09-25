# Nibe — personal portfolio

A bilingual portfolio for front-end design and development. The site presents two personal projects, explains the design decisions behind them, and uses animated cat scenes against photographic backgrounds. The contact section prepares an email in the visitor's mail app.

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

`npm run build` creates the deployable site in `dist/`. The preview server runs at `http://127.0.0.1:4175/`. Deploy the contents of `dist/` to any static host. Asset URLs use Vite's base path, so the build also works under a subdirectory.

GitHub Actions runs the formatting check, tests, and production build on pushes and pull requests.

## How it works

- Vue 3 components and Vite build tooling.
- English and Spanish content in `src/data/content.js`. The initial language follows the browser language for Spanish and English, and defaults to English for other languages. A manual choice persists in local storage.
- Cat animations use poster images before playback. Videos load when their scenes become visible and pause when the scene or browser tab is hidden. Reduced-motion preferences disable automatic playback.
- Project preview videos load on request. Each project also has a live-site link, a source-code link, and an expandable description of its challenge, decisions, and scope.
- The contact draft creates a `mailto:` link with encoded subject and message. Receiving mail at `contact@nibe.dev` depends on the domain's email routing configuration; this site has no mail server.

## Content and assets

Edit text, project links, social links, and the contact address in `src/data/content.js`. The site's visual styles and scene placement are in `src/style.css`. Images and video are served from `public/media/`; `public/favicon.jpg` is the site icon.

Project descriptions are based on the public repositories for [Nivel Retro](https://github.com/nibeKn/Tienda-Nivel-Retro) and [Ñamster Café](https://github.com/nibeKn/Namster-Cafe). Both are personal showcase projects. Their individual descriptions clarify which commerce, booking, or form interactions are demonstrations.
