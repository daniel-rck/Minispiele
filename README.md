<p align="center">
  <img src="./public/logo.svg" alt="Minispiele Logo" width="120" />
</p>

<h1 align="center">Minispiele</h1>

<p align="center">
  <strong>31 Browser-Minispiele. Lokal, ohne Account, ohne Tracking.</strong>
</p>

<p align="center">
  <a href="https://minispiele.daniel-rck.workers.dev"><strong>▶ Jetzt spielen</strong></a>
</p>

<p align="center">
  <a href="https://github.com/daniel-rck/Minispiele/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/daniel-rck/Minispiele/ci.yml?branch=main&label=CI&style=flat-square"></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/github/license/daniel-rck/Minispiele?style=flat-square"></a>
  <a href="https://github.com/daniel-rck/Minispiele/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/daniel-rck/Minispiele?style=flat-square"></a>
  <a href="./.github/workflows/ci.yml"><img alt="Bundle budget" src="https://img.shields.io/badge/bundle-%E2%89%A4%20270%20KB-blue?style=flat-square"></a>
  <br>
  <a href="https://react.dev"><img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square"></a>
  <a href="https://www.typescriptlang.org"><img alt="TypeScript 5.7" src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white&style=flat-square"></a>
  <a href="https://vitejs.dev"><img alt="Vite 7" src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white&style=flat-square"></a>
  <a href="https://tailwindcss.com"><img alt="Tailwind 4" src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square"></a>
  <img alt="PWA ready" src="https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white&style=flat-square">
  <a href="https://prettier.io"><img alt="Code style: Prettier" src="https://img.shields.io/badge/code_style-prettier-F7B93E?logo=prettier&logoColor=white&style=flat-square"></a>
</p>

---

## Was ist das?

Sammlung kleiner Browser-Minispiele als Progressive Web App. Alles läuft im Browser — keine Server, keine Accounts, keine Tracker. Mobile-first gebaut, offline-fähig via Service Worker, mit a11y-Smoke-Tests (axe-core) und Touch-Targets ≥ 44 px.

## Spiele

31 Spiele in sechs Kategorien — **Logik & Denksport** (14) · **Wort & Sprache** (4) · **Action & Arcade** (4) · **Gehirntraining** (6) · **Karten** (1) · **Werkzeuge** (2). Vollständige Liste in [`GAMES.md`](./GAMES.md). Quelle der Wahrheit ist [`src/lib/gamesCatalog.ts`](./src/lib/gamesCatalog.ts).

## Quickstart

```sh
bun install
bun run dev
```

Dann [http://localhost:5173](http://localhost:5173) öffnen.

## Tech-Stack

- **React 19** + **TypeScript 5.7** + **Vite 7**
- **React Compiler** aktiv — automatische Memoization, weniger `useMemo`/`useCallback`-Boilerplate
- **Tailwind CSS 4** (Styling), **Zod** (Schema-Validierung)
- **Vitest** + **Testing Library** (Unit), **Playwright** (E2E)
- **PWA** via `vite-plugin-pwa` + Workbox
- **Cloudflare Workers** (Hosting), **Bun** (Package-Manager)

## Dev-Befehle

| Befehl                  | Zweck                                          |
| ----------------------- | ---------------------------------------------- |
| `bun run dev`           | Dev-Server (HMR)                               |
| `bun run test`          | Unit-Tests (einmalig)                          |
| `bun run test:watch`    | Unit-Tests im Watch-Modus                      |
| `bun run test:coverage` | Coverage-Report nach `coverage/`               |
| `bun run test:e2e`      | Playwright-E2E auf gebauter App                |
| `bun run lint`          | ESLint                                         |
| `bun run format`        | Prettier (Schreiben)                           |
| `bun run typecheck`     | TypeScript `--noEmit`                          |
| `bun run build`         | Production-Build nach `dist/`                  |
| `bun run preview`       | Lokale Vorschau des Builds                     |
| `bun run analyze`       | Build + öffnet `dist/stats.html` (Bundle-View) |
| `bun run worker:dev`    | Wrangler-Dev für den Cloudflare Worker         |
| `bun run worker:deploy` | Cloudflare-Worker-Deploy (manuell)             |

## Architektur in einer Minute

- **Spielkatalog:** [`src/lib/gamesCatalog.ts`](./src/lib/gamesCatalog.ts) ist die **Single Source of Truth** für alle Spiele — Home, Suche, Kategorien, Favoriten lesen alles daraus.
- **Layout:** Jedes Spiel wrapt in [`<GameLayout>`](./src/components/GameLayout.tsx) (Header, Back-Button, a11y-Landmarks).
- **State:** Favoriten und Recent-Games liegen als Hooks in [`src/hooks/`](./src/hooks/), globale Settings (Theme, Vibration, Sound) im Context in [`src/lib/useSettings.ts`](./src/lib/useSettings.ts) — LocalStorage ist immer Zod-validiert (siehe [`src/lib/crossGameSchemas.ts`](./src/lib/crossGameSchemas.ts)).

## CI / Deployment

CI grün = mergebar. Pipeline: `format:check` → `lint` → `typecheck` → `test:coverage` → `build` → Bundle-Budget (≤ 270 KB main chunk, Warnung bei Überschreitung) → Playwright-E2E. Production-Deploys übernimmt **Cloudflare Workers Builds** direkt via GitHub-Integration. Health-Check: `GET /healthz` → `ok`.

## Beitragen

PRs, Bug-Reports und Spielvorschläge sind willkommen — Details in [`CONTRIBUTING.md`](./CONTRIBUTING.md). Sicherheitslücken bitte gemäß [`SECURITY.md`](./SECURITY.md) melden.

## Lizenz

[MIT](./LICENSE) © Daniel Rück
