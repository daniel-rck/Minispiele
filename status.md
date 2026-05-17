# Status — Minispiele

Laufende Roadmap für Cross-Game-Features, A11y/UX-Polish und Tech-Qualität. **Keine neuen Spiele**, nur Verbesserungen am Bestand.

Vollständige Plan-Datei (mit Tasks, Aufwand, Dateipfaden, Verifikation): siehe Brainstorm-Session vom 2026-05-17. Inhalte hier sind die Zusammenfassung — für Details und konkrete Codepfade die Diskussion / Plan-Notiz nutzen.

## Phase 1 — Quick Wins & Fundament ✅ ERLEDIGT

Gemerged via PR #21 (Commits `c1832bb` + `55e0814`).

- ✅ **GameLayout-Wrapper** ersetzt das `<div max-w-3xl> + h1 + p + Game`-Boilerplate auf allen 27 Game-Pages (`src/components/GameLayout.tsx`)
- ✅ **gamesCatalog.ts** als Single Source of Truth für Spiele-Liste, Kategorien, Slug-Lookup (`src/lib/gamesCatalog.ts`)
- ✅ **useRecentGames** + **useFavorites** Hooks (MRU-Ring-Buffer 20, Favorites-Cap 64) — Zod-validierte Persistenz (`src/hooks/`)
- ✅ **Home-Refactor**: Suchleiste (akzentinsensitiv, debounced), „★ Favoriten"-Section, „Zuletzt gespielt"-Section
- ✅ **Globales SettingsModal** (lazy via BottomSheet): Theme System/Hell/Dunkel, Vibration on/off, Sound on/off — Theme wird synchron beim Modul-Laden gesetzt (kein FOUC); `useVibration` respektiert die Einstellung
- ✅ **crossGameSchemas.ts** trennt Cross-Game-Schemata von game-spezifischen → Initial-Bundle bleibt unter 250 KB Budget
- ✅ **axe-CI smoke** (`src/components/a11y.smoke.test.tsx`) für Home, GameLayout, DiceRoller, MemoryGame, SettingsModal
- ✅ Touch-Target-Audit: keine zu kleinen Targets gefunden — `@media (pointer: coarse)` in `index.css` erzwingt 44 px

## Phase 2 — Cross-Game-Features ⏳ OFFEN

Aufwand grob: 1–2 Wochen. Reihenfolge:

1. **Zentrales Stats-Schema** (`src/lib/stats.ts`) — eine Run-Liste statt 42 verstreuter Best-Werte. `GameRunSchema = { slug, at, durationMs?, score?, won?, difficulty? }`. Bestehende Best-Schemata bleiben (ergänzt, ersetzt nicht). Key `minispiele.stats.v1`.
2. **`recordGameRun()` via GameLayout-Context** (`src/lib/gameRunContext.tsx`) — `onRunComplete`-Callback je Spielkomponente. 3–5 Zeilen Patches in Spielen, die schon `applyHighscore` nutzen.
3. **Stats-Dashboard** als Route `/stats`: Gesamtspiele, 14-Tage-Sparkline, Bestenliste pro Spiel. Eingang via SettingsModal. Lazy-Route.
4. **Achievement-Engine** (`src/lib/achievements.ts`) — deklarative Predicates `(stats) => boolean`. Toast über AriaLive + visuell. Beispiele: „Erste Partie", „10 Snake", „Wordle 3-Tage-Streak", „Memory <60s easy". Key `minispiele.achievements.v1`.
5. **Daily Challenge — Seed-Infrastruktur** (`src/lib/rng.ts`, `dailyChallenge.ts`) — `dailySeed(date) → string` (ISO-Date), `mulberry32` RNG. Daily-Mode in Wordle, Sudoku, Schulte, Anagram. Key `minispiele.daily.v1`.
6. **Share-Emoji-Grid** (`src/lib/dailyShare.ts`) — `formatDailyShare(slug, result)`. Web Share API + Clipboard-Fallback.
7. **Farbblind-Modus** — Settings-Flag `colorblind: boolean`. Betroffen: RingSort, Flow, Mastermind, Memory. Zusätzliche Form-/Symbol-Layer (●, ▲, ■, ♦ / Buchstaben / Icons) → Spiele bleiben ohne Farbe lösbar.
8. **Tutorial-Overlay** (`src/components/TutorialOverlay.tsx`) — pro Spiel optionales `tutorialSteps`-Array, First-Visit-Detection via `minispiele.tutorial.seen.v1`. Skip + „Nicht mehr zeigen".

## Phase 3 — Tiefer-Refactoring & Skalierung ⏳ OFFEN

Aufwand grob: 1–2 Wochen. Reihenfolge:

1. **Storybook 8** (Vite-Builder) für `GameCard`, `BottomSheet`, `SettingsModal`, `StatsDashboard`, `AchievementToast`, `TutorialOverlay`, `Ring`, `Peg`, `FlipDigit`, `WordleKeyboard`. Storybook-only, kein Bundle-Impact.
2. **DiceRoller splitten** (796 Z. → ~200) — Pure Logik nach `src/lib/diceAnimation.ts`, Subkomponenten `DiceTray`, `DiceControls`, `DiceHistorySheet`, `DicePresetMenu`.
3. **BubblesGame splitten** (636 Z.) — Pure State nach `src/lib/bubbles.ts` analog `snake.ts`/`snake.test.ts`. Sub: `BubblesCanvas`, `BubblesHUD`.
4. **BlocksGame splitten** (561 Z.) — `src/lib/blocks.ts` (Tetromino-Bag, Kollision, Line-Clear) + `BlocksGrid`, `BlocksHUD`, `BlocksControls`.
5. **Keyboard-Audit Bubbles/Breakout/Blocks** — Pfeile/Space/Enter, Visible Focus-Ring, Hint-Overlay.
6. **Einheitliche `GestureLayer`-Komponente** für Swipe/Tap/LongPress — ersetzt ad-hoc TouchHandler in Bubbles/Breakout/Blocks/Snake/2048.
7. **E2E-Coverage auf ≥ 50 %** (15 weitere Specs, Page-Object-Pattern `e2e/helpers/gamePage.ts`).
8. **Lighthouse-CI** — Budgets perf ≥ 90, a11y ≥ 95, PWA ≥ 90.
9. **Optional: Cloud-Sync via Workers KV** — `worker/sync.ts`, Client-LWW + Merge `stats.runs` per `id+at`. Opt-in via Settings.

## Querschnitt: Wiederverwendete Patterns

- **Persistenz**: `useLocalStorage` (`src/lib/useLocalStorage.ts`) + Zod-Schema in `crossGameSchemas.ts` (cross-game) oder `persistedSchemas.ts` (game-spezifisch) + Key in `STORAGE_KEYS` (`src/lib/constants.ts`). Keine direkten `localStorage.getItem`-Calls.
- **Modals**: alles über `BottomSheet` (Focus-Trap, Swipe-Dismiss, Escape).
- **Announcements**: `AriaLive` (`src/components/AriaLive.tsx`) für Achievements/Daily-Resultate/Stats.
- **Best-Tracking**: `applyHighscore`/`isBetter` (`src/lib/highscores.ts`) bleibt — `recordGameRun` ruft intern weiterhin diese Funktionen → kein Bruch existierender Schemata.
- **Timing**: `useGameTimer` (`src/lib/useGameTimer.ts`) liefert `durationMs` für Runs.
- **Tracking**: jeder Routenwechsel im `GameLayout` updated automatisch `useRecentGames` via `markPlayed(slug)`.

## Risiken & Gegenmaßnahmen

- **Bundle-Budget 250 KB** (aktuell 254 995 < 256 000 B): Storybook (3.1), Stats-Page (2.3), neue Modals konsequent `lazy()` einbinden. Achievements-Predicates pure Funktionen, kein UI im Hot-Path.
- **Schema-Migration**: neue Stats-Schicht (2.1) ergänzt, ersetzt nicht. Bei Drift: `migrateLegacyBests()` einmal beim Mount.
- **Große Refactors (3.2–3.4)**: pro Komponente erst Logik extrahieren (Tests grün), dann UI splitten. Schritt-für-Schritt-PRs, kein Big-Bang.
- **Daily Challenge**: „Tag" ist lokal (ISO-Date Client) — explizit dokumentieren.
