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

- **CI** (`ci.yml`) — auf jedem PR & Push auf `main`: lint, typecheck, test, build.
- **PR Preview Deploy** (`preview.yml`) — pro PR ein eigener Worker `minispiele-pr-<NR>`; postet einen Kommentar mit der Preview-URL.
- **PR Preview Cleanup** (`preview-cleanup.yml`) — löscht den Preview-Worker, wenn der PR geschlossen wird.
- **Deploy** (`deploy.yml`) — Push auf `main` deployt den produktiven Worker.

Benötigte GitHub-Secrets (Repo → Settings → Secrets and variables → Actions):

| Secret                         | Zweck                                                                                              |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`         | Cloudflare-API-Token mit Worker-Edit-Rechten.                                                      |
| `CLOUDFLARE_ACCOUNT_ID`        | Cloudflare-Account-ID.                                                                             |
| `CLOUDFLARE_WORKERS_SUBDOMAIN` | (Optional) eigener `*.workers.dev`-Subdomain-Slug, damit der PR-Kommentar die fertige URL enthält. |

Ohne die ersten beiden Secrets schlagen die Deploy-Workflows fehl; **CI bleibt davon unberührt** und läuft sofort.

## Lizenz

MIT — siehe [LICENSE](./LICENSE).
