# Minispiele

Sammlung kleiner Browser-Minispiele. Lokal, ohne Account, ohne Tracking — alles läuft im Browser.

Aktuelle Spiele & Mini-Apps (Quelle der Wahrheit: `src/pages/Home.tsx`):

**Logik & Denksport**

- **Ringe sortieren** — sortiere bunte Ringe in drei Farben auf vier Stäben.
- **2048** — wische Kacheln zusammen, bis die 2048 erscheint.
- **Schiebepuzzle** — klassisches 15er-Puzzle.
- **Minensucher** — decke Felder auf, ohne eine Mine zu treffen.
- **Sudoku** — fülle das 9×9-Gitter regelkonform.
- **Bildrätsel** — Picross/Nonogramm anhand Zahlenhinweisen.
- **Lichter aus** — alle Felder ausschalten.
- **Codeknacker** — 4-Farben-Mastermind.
- **Türme von Hanoi** — alle Scheiben auf den rechten Stab.
- **Kistenschieber** — Sokoban-Lagerhaus-Puzzle.
- **Verbinden** — Flow: gleichfarbige Punkte ohne Kreuzung verbinden.
- **Tangram** — sieben Teile zu Silhouetten zusammensetzen.

**Wort & Sprache**

- **Wordle** — 5-Buchstaben-Wort in sechs Versuchen erraten.
- **Galgenmännchen** — Wort Buchstabe für Buchstabe erraten.
- **Wortgitter** — versteckte deutsche Wörter im Buchstabengitter finden.
- **Wortsalat** — Anagramme entwirren.

**Action & Arcade**

- **Snake** — sammle Futter, wachse, kollidiere nicht.
- **Ziegelbruch** — Breakout-Klon mit Paddel und Ball.
- **Blasenschießen** — farbige Blasen zum Platzen bringen.
- **Blockstapler** — Tetris-artige fallende Blöcke.

**Gehirntraining**

- **Memory** — finde alle Paare.
- **Simon Says** — wachsende Farb- und Tonfolgen wiederholen.
- **Reaktionstest** — möglichst schnell reagieren, sobald die Fläche grün wird.
- **Zahlentafel** — Schulte-Tabelle 1 bis 25 in Reihenfolge antippen.
- **Stroop-Test** — Schriftfarbe (nicht das Wort) erkennen.

**Karten**

- **FreeCell** — klassische Solitär-Variante.

**Werkzeuge**

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
