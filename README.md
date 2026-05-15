# Minispiele

Sammlung kleiner Browser-Minispiele. Lokal, ohne Account, ohne Tracking — alles läuft im Browser.

Aktuelle Spiele & Mini-Apps:

- **Ringe sortieren** — sortiere bunte Ringe in drei Farben auf vier Stäben.
- **Clicker Timer** — Countdown einstellen; jeder Tipp startet ihn neu und beendet den Alarm.
- **Würfel** — frei konfigurierbares Würfelset (Anzahl, Würfeltyp, Farbe) mit Halten-Funktion für Kniffel, Mäxle & Co.

## Tech-Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- Vitest + Testing Library
- PWA via `vite-plugin-pwa`
- Cloudflare Workers (Static Assets) als Hosting
- Bun als Package-Manager

## Entwicklung

```sh
bun install
bun run dev          # Dev-Server
bun run test         # Unit-Tests
bun run lint         # ESLint
bun run typecheck    # TypeScript
bun run build        # Production-Build nach dist/
bun run preview      # lokale Vorschau des Builds
```

## Deployment

```sh
bun run build
bun run worker:deploy
```

Health-Check: `GET /healthz` → `ok`.

## CI / Auto-Deploy

GitHub Actions Workflows in `.github/workflows/`:

- **CI** (`ci.yml`) — auf jedem PR & Push auf `main`: format, lint, typecheck, test+coverage, build, bundle-budget, anschließend Playwright-E2E.

Deploys (Production & PR-Previews) übernimmt **Cloudflare Workers Builds** direkt über die GitHub-Integration — kein wrangler-Step im Workflow nötig.

## Lizenz

MIT — siehe [LICENSE](./LICENSE).
