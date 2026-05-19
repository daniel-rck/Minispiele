---
name: import-foreign-game
description: Portiert ein self-contained HTML-Spiel aus dem Branch `feat/add-foreign-games` (Ordner `todo/`) in die React/TypeScript-Minispiele-App. Nutze diesen Skill, wenn der User sinngemäß sagt "importiere <spielname>", "port <spielname>", "übernimm <spielname> aus den foreign games" oder "füge <spielname> aus dem todo-Ordner hinzu". Der Skill liest die Original-HTML aus dem Branch, erzeugt React-Komponente + Page + Route + Catalog-Eintrag + Preview-SVG + E2E-Smoke-Test und stellt sicher, dass alle Quality-Gates (lint, typecheck, test, build) grün sind.
---

# Foreign Game → React-Port

## Wann verwenden

Trigger: User möchte ein Spiel aus `origin/feat/add-foreign-games:todo/*.html` in die App importieren. Beispiele:

- "importier mir snake aus den foreign games"
- "port chess aus dem feat/add-foreign-games branch"
- "füg tic-tac-toe und whack-a-mole aus dem todo-ordner hinzu"

Für **mehrere** Spiele: Skill pro Spiel sequenziell durchlaufen (eine Komponente, ein Commit). Nicht parallelisieren — jeder Port erzeugt seine eigenen Tests/Routes/Catalog-Einträge, parallele Edits am `App.tsx`/`gamesCatalog.ts`/`constants.ts` würden kollidieren.

## Voraussetzungen prüfen

```sh
git status                                          # Working tree clean?
git branch --show-current                           # Auf dem richtigen Branch (claude/...)?
git fetch origin feat/add-foreign-games             # Branch holen, falls noch nicht da
git show origin/feat/add-foreign-games:todo/<slug>.html | head -50   # Quelle existiert?
```

Wenn die HTML-Datei nicht existiert: stoppen, dem User die verfügbaren Dateien nennen via:

```sh
git show origin/feat/add-foreign-games --stat -- 'todo/*.html' | head -50
```

## Architektur, die jeder Port erfüllen muss

Das Projekt verlangt für **jedes** neue Spiel exakt diese 7 Touchpoints (siehe `CONTRIBUTING.md`):

1. `src/components/<Name>Game.tsx` — Spiel-Komponente (Tailwind-Klassen, kein Inline-CSS, kein dunkles Hardcoded-Theme)
2. `src/pages/<Name>.tsx` — Page-Wrapper mit `<GameLayout title="…" description="…">`
3. `src/App.tsx` — `lazy()`-Import + `<Route path="<slug>">` innerhalb des AppShell (alphabetisch oder am Ende einfügen — bestehende Reihenfolge beibehalten)
4. `src/lib/gamesCatalog.ts` — neuer Eintrag in `GAME_INPUTS` (`to`, `title`, `description`, `preview`, `previewAlt`, `category`)
5. `src/lib/constants.ts` — `STORAGE_KEYS`-Eintrag (`<SLUG>_BEST`, `<SLUG>_STATE`, …), falls das Spiel persistiert
6. `public/games/<slug>-preview.svg` — 640×360 SVG-Vorschau (gleicher Stil wie `public/games/snake-preview.svg`)
7. `e2e/smoke.spec.ts` — Eintrag im `games[]`-Array (`{ path: '/<slug>', title: /<Titel>/i }`)

Optional, falls das Spiel persistierten State hat: Zod-Schema in `src/lib/persistedSchemas.ts` und Hook über `useLocalStorage(STORAGE_KEYS.X, Schema, default)` — siehe `ReactionGame.tsx` als Vorlage.

## Konvertierungs-Regeln HTML → React

Die HTML-Originale folgen einem festen Muster: Dark-Theme (`#1a1a2e` / `#16213e` / `#c9b458`), eine `<canvas>`-Spielfläche oder DOM-Gitter, `localStorage` für Highscore, deutsche UI. Beim Port gilt:

| HTML-Original                              | React-Port                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Inline-`<style>` mit `#1a1a2e` etc.        | **Verwerfen.** Tailwind-Klassen + Dark/Light-Mode (`bg-slate-900 dark:bg-slate-950`, `text-amber-400`, …)  |
| `<a class="back-link" href="spiele.html">` | **Verwerfen.** Back-Button stellt `<GameLayout>` automatisch                                               |
| `<h1>TITEL</h1>` als Seitenüberschrift     | **Verwerfen.** Titel kommt aus `<GameLayout title="…">`                                                    |
| Inline `<script>` mit globalen `var`/`let` | React-Hooks: `useState`, `useEffect`, `useRef`, `useCallback`                                              |
| `document.getElementById(...)`             | `useRef<HTMLCanvasElement>(null)` + `ref={canvasRef}`                                                      |
| `localStorage.getItem('snake-high')`       | `useLocalStorage(STORAGE_KEYS.SNAKE_BEST, Schema, default)`                                                |
| `window.addEventListener('keydown', …)`    | `useEffect` mit Cleanup (`return () => window.removeEventListener(…)`)                                     |
| `setInterval` / `requestAnimationFrame`    | `useEffect` mit `clearInterval` / `cancelAnimationFrame` im Cleanup                                        |
| `alert()` / "Game Over"-Englisch           | Deutsche Texte (z. B. "Vorbei!", "Verloren") — `e2e/smoke.spec.ts` testet, dass kein "Game Over" erscheint |
| Audio via `new Audio('...')`               | `useAudioBeep()` / `useToneAudio()` aus `src/lib/` (nutzt `setAudioSetting`-Bridge)                        |
| Touch-Events `touchstart`/`touchmove`      | React-`onTouchStart` / `onPointerDown` oder `usePointerSwipe`-Hook (falls vorhanden), 44×44px Mindest-Tap  |

**Mindestziele aus CONTRIBUTING.md:**

- Mobile-first ab 320 px Breite
- Touch-Targets ≥ 44 px (Tailwind: `min-h-11 min-w-11`)
- Keine `any`-Typen, kein Inline-Style außer für dynamisch berechnete Werte
- Bundle-Budget: 270 KB main chunk — bei großen Spielen ist Lazy-Loading via `React.lazy` schon durch `App.tsx`-Pattern abgedeckt

## Schritt-für-Schritt

### 1. Quelle & Mapping festlegen

```sh
git show origin/feat/add-foreign-games:todo/<slug>.html > /tmp/<slug>.html
wc -l /tmp/<slug>.html
```

Notiere:

- **Slug** (URL-Pfad, kebab-case): meist Dateiname ohne `.html`. Falls schon belegt (vgl. `gamesCatalog.ts`): umbenennen oder mit User klären.
- **Komponentenname** (PascalCase): z. B. `WhackAMole` für `whack-a-mole.html`.
- **Titel** (deutsch, Catalog-Titel): aus `<h1>` im HTML, oder besser, kürzerer/idiomatischer deutscher Name.
- **Kategorie** (`logik` | `wort` | `action` | `gehirntraining` | `karten` | `werkzeuge`): aus dem `badge`-Feld in `todo/spiele.html` ableitbar (Arcade → action, Logik → logik, Karten → karten, etc.).

### 2. Komponente schreiben

Vorlagen je nach Spieltyp:

- **Canvas-basiert** (snake, breakout, pong, asteroids): `src/components/BreakoutGame.tsx` oder `BubblesGame.tsx` als Referenz
- **DOM-Gitter** (sudoku, sokoban, sliding-puzzle): `src/components/SokobanGame.tsx` oder `SudokuGame.tsx`
- **Karten** (freecell, blackjack, poker): `src/components/FreecellGame.tsx`
- **Reaktion/Tap** (whack-a-mole, simon): `src/components/ReactionGame.tsx`

Die HTML-Game-Logik (Zustand, Loop, Eingabe-Handling) 1:1 portieren, dabei:

- Globale Variablen → `useState` / `useRef`
- Init-Funktion → `useEffect` mit `[]`-Deps für einmaligen Start, plus separates `useEffect` für Game-Loop
- Render-Funktion (Canvas) → `useEffect`, das auf State-Änderungen reagiert
- Storage → `useLocalStorage` mit Zod-Schema (Schema bei Bedarf in `persistedSchemas.ts` ergänzen)

### 3. Page + Route + Catalog + Constants

Drei Edits, immer in dieser Reihenfolge:

```ts
// 1. src/pages/<Name>.tsx — neu anlegen, exakt wie src/pages/Reaction.tsx
import GameLayout from '../components/GameLayout';
import <Name>Game from '../components/<Name>Game';

export default function <Name>() {
  return (
    <GameLayout title="<Titel>" description="<1-Satz-Beschreibung>">
      <<Name>Game />
    </GameLayout>
  );
}
```

```ts
// 2. src/App.tsx — zwei Stellen
const <Name> = lazy(() => import('./pages/<Name>'));
// und in <Routes>:
<Route path="<slug>" element={<LazyRoute label="<slug>"><<Name> /></LazyRoute>} />
```

```ts
// 3. src/lib/gamesCatalog.ts — Eintrag in GAME_INPUTS anhängen
{
  to: '/<slug>',
  title: '<Titel>',
  description: '<1-Satz-Beschreibung wie in GameLayout>',
  preview: '/games/<slug>-preview.svg',
  previewAlt: 'Vorschau: <kurze visuelle Beschreibung>',
  category: '<category>',
},
```

```ts
// 4. src/lib/constants.ts — nur falls Spiel persistiert
STORAGE_KEYS.<SLUG>_BEST: 'minispiele.<slug>.bestScore.v1',
// (Naming-Konvention: minispiele.<slug>.<feld>.v1)
```

### 4. Preview-SVG

640×360 viewBox, `<rect>` als Hintergrund (`#0f172a` ≈ slate-900), darauf eine vereinfachte Skizze des Spielfelds. Referenz: `public/games/snake-preview.svg`. **Nicht** Original-PNG/Screenshot — SVG bleibt scharf und klein.

Wenn du keine sinnvolle Skizze findest: minimal-funktional (Titel + Icon-Glyph aus `todo/spiele.html`) ist okay, aber konsistent mit den bestehenden Previews stylen (Akzentfarbe `#fbbf24` ≈ amber-400, Subtilität `#1e293b` ≈ slate-800).

### 5. E2E-Smoke-Test

```ts
// e2e/smoke.spec.ts — zwei Einträge im games-Array, sortiert wie bestehende
{ path: '/<slug>', title: /<Titel>/i },
```

Falls das Spiel komplexere Interaktionen hat (Drag, Keyboard-Sequenzen): separater Test in `e2e/<slug>.spec.ts` analog zu `e2e/gfrett.spec.ts` oder `e2e/traffic-jam.spec.ts`.

### 6. Quality-Gates — alle MÜSSEN grün sein

```sh
bun run lint
bun run typecheck
bun run test                     # Unit-Tests (Vitest)
bun run build                    # Bundle + Budget-Check
bun run test:e2e -- --grep <slug>   # Optional, falls Playwright lokal läuft
```

Bei Fehlern: erst beheben, dann commit. Niemals mit `--no-verify` umgehen.

### 7. Commit & Push

```sh
git add src/components/<Name>Game.tsx src/pages/<Name>.tsx src/App.tsx \
        src/lib/gamesCatalog.ts src/lib/constants.ts \
        public/games/<slug>-preview.svg e2e/smoke.spec.ts
# Plus persistedSchemas.ts / extra e2e-Datei, falls angelegt
git commit -m "feat: add <Titel> game ported from foreign-games"
git push -u origin <branch>
```

Anschließend Draft-PR erstellen (gemäß Repo-Konvention) — der Skill ist damit fertig.

## Mehrere Spiele auf einmal

User sagt z. B. "importier snake, tic-tac-toe und whack-a-mole":

1. Spiele in einer **fest geordneten Liste** abarbeiten (z. B. alphabetisch).
2. Pro Spiel: kompletter Durchlauf Schritt 1–6, **ein** Commit pro Spiel.
3. Erst nach allen Spielen pushen + Draft-PR mit Sammel-Beschreibung erstellen.

Grund: ein Commit pro Spiel macht spätere Bisects und Rollbacks trivial. Hat sich beim bestehenden Repo-Verlauf etabliert (`feat: add Traffic Jam`, `feat: add Hyperfokus`, `feat: add gfrett`).

## Häufige Stolperfallen

- **Doppelte Slugs:** `snake.html`, `wordle.html`, `sudoku.html`, `memory.html`, `breakout.html`, `bubbles.html`, `freecell.html`, `tangram.html`, `mastermind.html`, `tower-of-hanoi.html`, `sokoban.html`, `lights-out.html`, `nonogramm.html`, `simon-says.html`, `hangman.html`, `wordsearch.html`, `schiebepuzzle.html`, `rush-hour.html` sind **bereits in der App** (vgl. `gamesCatalog.ts`). Wenn der User eines davon nennt: **nicht** überschreiben, sondern erst beim User rückfragen (Variante? Ersetzen? Skip?).
- **Bundle-Größe:** Schach (`chess.html`, 851 Zeilen) oder Solitär (`solitaer.html`, 631 Zeilen) sind groß. Per `React.lazy` ist das schon abgedeckt — aber `bun run build` zeigt die Auswirkung. Bei harter Budget-Überschreitung mit User klären.
- **localStorage-Keys:** Die HTML-Originale benutzen Keys wie `snake-high`. Beim Port **neuen** Key über `STORAGE_KEYS` verwenden (Konvention `minispiele.<slug>.<feld>.v1`), nicht den alten String hardcoden.
- **Audio:** Viele HTML-Spiele machen `new Audio(...)` mit base64-WAV. Das ist im Bundle teuer — entweder durch `useToneAudio` (Web-Audio-API generiert) ersetzen oder ganz weglassen, falls der User es nicht explizit will.
- **"Game Over"-Test:** `e2e/smoke.spec.ts` Zeile 53–60 schlägt **fail**, wenn das gerenderte Spiel den String "Game Over" enthält. Im Port immer "Vorbei!" / "Verloren" / "Spiel beendet" verwenden.
- **Theme:** Niemals `#1a1a2e` o. ä. hardcoden — die App nutzt Tailwind mit Dark/Light-Mode-Switch.

## Ergebnis dem User melden

Nach erfolgreichem Push 1–2 Sätze:

> "<Spiel> portiert und gepusht. Komponente: `src/components/<Name>Game.tsx`, Route: `/<slug>`, Catalog-Eintrag in Kategorie `<cat>`. Draft-PR: <url>."

Bei mehreren Spielen Punktliste mit je 1 Zeile pro Spiel.
