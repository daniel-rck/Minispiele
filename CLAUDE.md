# Claude-Code-Hinweise für Minispiele

Sammlung von 65 Browser-Minispielen als Offline-PWA. Kein Account, kein Backend,
keine Telemetrie — Spielstände und Einstellungen liegen lokal im Browser.

## Quelle der Wahrheit

**Foundation [`daniel-rck/web-base`](https://github.com/daniel-rck/web-base)** —
Stack, Layout-System, Storage-/PWA-/CI-Konventionen. Bei ungeklärten
Entscheidungen die minimale, zu den bestehenden Mustern passende Variante
wählen. Scaffolding & Updates über die CLI (`bunx github:daniel-rck/web-base …`),
nicht von Hand kopieren. `.github/workflows/ci.yml` fährt den Drift-Guard
`web-base-check` — wer eine *owned* Datei anfasst, bricht die CI.

## Quality Gates

Vor jedem Commit grün halten:

```bash
bun run lint        # oxlint + oxfmt --check
bun run typecheck   # tsc (App + SW + Worker)
bun run test        # Vitest
bun run build       # SPA + PWA
bun run test:e2e    # Playwright (Smoke pro Spiel)
```

## Konventionen (gemäß web-base)

- **Bun** als Runtime & Package-Manager (kein npm/yarn-Lockfile).
- **oxlint + oxfmt** für Lint + Format. `oxlint.base.json` und `.oxfmtrc.json`
  kommen aus web-base und werden bei `update` überschrieben — nicht anfassen;
  app-eigene Regeln gehören in `.oxlintrc.json` (`overrides`), Format-Ausnahmen
  in `.prettierignore`. Einzelne Stellen mit
  `// oxlint-disable-next-line <regel> -- <grund>` begründen.
- **TypeScript strict** inkl. `noUncheckedIndexedAccess`;
  `verbatimModuleSyntax` (→ `import type`); `type` statt `interface`.
- **Deutsche UI + README, englischer Quellcode** (Bezeichner, Kommentare,
  Commits, Doku).
- **Design-Tokens statt Roh-Paletten** im Chrome: `bg-surface`, `text-fg-muted`,
  `border-border`, `text-fg-on-accent` (Text auf Akzent-Flächen, nie
  `text-white`) … aus `src/lib/ui/tokens.css` (owned) und der Naht
  `src/lib/ui/theme.css`. Für Spielfarben gilt das ausdrücklich **nicht** —
  siehe unten.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).

## App-spezifische Leitplanken

- **Spielfarben sind Spielzustand, keine Tokens.** Tetris-Steine,
  Mastermind-Pins, Wordle-Kacheln, Solitaire-Farben: gesättigte Paletten
  (`bg-red-500`, `bg-emerald-500`, …) bleiben literal. Das gilt auch für
  neutrale Töne, wo sie Zustand tragen — der Arcade-Spielfeld-Hintergrund
  `bg-slate-900 dark:bg-slate-950` (Breakout, Asteroids, Bubbles, ColorFlood,
  Flappy, Blocks, DoodleJump, ConwayBattle) ist **absichtlich in beiden Themes
  dunkel**; `bg-surface` würde ihn im Light Mode weiß machen und das Spielfeld
  zerstören.
- **`react/no-array-index-key` ist in `src/components/*Game.tsx` (plus
  DiceRoller/TimerDisplay/SettingsSheet) abgeschaltet**, sonst app-weit `error`
  (`.oxlintrc.json`): in einem Sudoku- oder Nonogramm-Gitter *ist* der Index die
  Identität einer Zelle. **Die Abschaltung nicht ausweiten.** Biomes
  `useSemanticElements` hieß hier `jsx-a11y/prefer-tag-over-role`; das ist in
  web-bases `oxlint.base.json` flottenweit aus (es will `<output>` statt jedes
  `role="status"`), die Spiel-Ausnahme ist damit gegenstandslos. `role="grid"`
  auf einem CSS-Grid bleibt die richtige ARIA-Rolle.
- **`todo/` ist vendored**: self-contained HTML-Spiele, die noch nicht portiert
  sind (siehe Skill `import-foreign-game`). In `.oxlintrc.json`
  (`ignorePatterns`) und `.prettierignore` ausgenommen — nicht formatieren,
  nicht linten, wortwörtlich lesen.
- **Theme über `data-theme`**, nicht über eine `.dark`-Klasse: eine Klasse kann
  „folge dem OS" ohne JavaScript nicht ausdrücken, also flackerte jede
  erzwungene Wahl bis React gemountet war. Die Wahl liegt weiter *im
  Settings-Blob* (`minispiele.settings.v1`) statt unter `localStorage["theme"]`
  — das erlaubt das Layout-Template ausdrücklich; der Vertrag ist nur, dass
  `data-theme` am `<html>` landet. `public/theme-init.js` und `applyTheme` in
  `src/lib/useSettings.ts` müssen synchron bleiben, abgesichert durch
  `src/lib/themeInit.test.ts`.
- **Keine Fonts vom CDN.** Nunito kommt über `@fontsource` aus `node_modules`.
  Der alte `@import url(fonts.googleapis.com/…)` stand außerdem *nach* den
  Regelblöcken und wurde von der CSS-Spec verworfen — die Schrift lud gar nicht.
  Alle `@import`s stehen jetzt am Anfang von `src/index.css`.
- **Akzent ist `--accent-h: 200`** (Türkis, seit web-base 0.6.0; vorher 195)
  in `src/lib/ui/theme.css`, das nur noch `tokens.css` importiert und den Hue
  setzt. `theme_color` ist dessen `accent-600`, **`#007a88`** — in
  `vite.config.ts`, `index.html`, `public/theme-init.js` und `src/lib/brand.ts`
  (`THEME_COLOR_LIGHT`, von `themeInit.test.ts` gegen `theme-init.js`
  geprüft). Die app-eigenen Skalen (`primary-*`, `brand-*` als Alias des
  Akzents, `surface-*`, `cat-*`, `highlight-*`) stehen in `src/index.css`.
- **Router**: `src/lib/router.tsx` lädt `AppShellRoute` als Root-Layout-Route
  (lazy) mit `ErrorBoundary: RouteError` und `HydrateFallback: RouteFallback`;
  die Spiele hängen unter einer pfadlosen Kind-Route mit eigenem `RouteError`
  (Fehler einer Seite rendern in der Shell), am Ende `{ path: "*", Component:
  NotFound }`. Neue Spiele **vor** der `*`-Route eintragen. `tryImport` lädt
  bei einem verschwundenen Chunk nach einem Deploy einmal neu; `RouteError`
  fängt den Rest.
- **Service Worker**: `src/sw/index.ts` ruft nur `registerAppShell()` aus dem
  owned `src/sw/base.ts` (Precache, Offline-Deep-Links, Aktivierung erst auf
  `SKIP_WAITING`). Die Update-UI ist app-eigen — `UpdateBanner` und „Auf
  Updates prüfen" im Einstellungs-Sheet über `src/lib/usePwaUpdate.tsx`, das auf
  web-bases `useAppUpdate()` aufsetzt und zusätzlich bei Fokus und auf Knopfdruck
  `registration.update()` ruft. Kein zweites `registerSW`/`useRegisterSW`.
- **Test-Setup**: `src/test/setup.ts` ist owned (fake-indexeddb, jest-dom,
  Cleanup, `matchMedia`); das app-eigene Canvas-2D-Stub steht in
  `src/test/canvas.ts`, beide in `setupFiles` von `vitest.config.ts`.
  `virtual:pwa-register/react` ist dort auf `src/test/pwaRegisterStub.ts`
  gemappt.
- **IndexedDB** (`src/lib/db/db.ts`, `createDBOpener`) ist vorbereitet, aber
  ungenutzt — der State liegt in Zod-validiertem `localStorage`. Name `"app"`,
  Version 1 bleiben, bis der erste Store kommt.
- **Bundle-Budget**: die CI warnt ab 270 KB Main-Chunk. Neue Spiele lazy laden.

## Bewusste Abweichungen

- **Eigene CI statt des reusable `web-app-ci.yml`.** Der Job hier macht
  dieselben vier Gates plus Bundle-Budget und Playwright-E2E; der geteilte
  Workflow kann das nicht. `web-base-check` läuft daneben, gepinnt auf
  `@v0.6.0` (Dependabot hebt den Tag).
- **Kein `AppShell`/`AppNav`/`PageHeader`.** Die App komponiert ihre Shell in
  `src/components/AppShellRoute.tsx` (statt `src/App.tsx`); die drei Dateien
  lägen ungenutzt in `src/lib/ui/` und sind entfernt. Übernommen sind
  `AppHeader` (mit `maxWidthClass="max-w-7xl"`; der Titel ist dort ein
  `<span>`, das `<h1>` trägt jede Seite selbst über `GameLayout` bzw. `Home`),
  `InstallButton`, `OfflineIndicator` (Badge im Header) und `primitives`.
- **Kein `useTheme`/`ThemeToggle` aus web-base** — das Theme hängt am
  Settings-Blob und wird im Einstellungs-Sheet gewählt, siehe oben.
- **Kein `UpdatePrompt`** — die App hat ihre eigene Update-UI auf
  `useAppUpdate()`, siehe oben.
- **Folge: `web-base check --strict` scheitert absichtlich** (layout und pwa
  sind nur teilweise übernommen: `AppShell`, `AppNav`, `PageHeader`,
  `ThemeToggle`, `useTheme`, `UpdatePrompt` fehlen). Lokal und in der CI läuft
  der normale `check`; `update core --apply` legt die fehlenden Dateien wieder
  an, weil die Blöcke übernommen sind — danach wieder löschen.
- **Worker-Laufzeit**: `compatibility_date = "2025-10-01"` und
  `nodejs_compat` bleiben vorerst (der Worker braucht kein Node-Built-in);
  beides ändert die Workers-Laufzeit und wird einzeln mit Deploy-Check
  angehoben bzw. entfernt.

## Offene Punkte

- Rund 200 `typescript/no-non-null-assertion`-Warnungen (Kanon: `warn`) —
  Altbestand, beim Anfassen einer Datei jeweils mitaufräumen.
- **React-Compiler-Regeln als Altbestand.** oxlint prüft `react/set-state-in-effect`,
  `react/refs`, `react/immutability` und `react/purity` (Biome kannte sie nicht);
  in 54 Bestandsdateien gab es beim Umstieg rund 90 Befunde. Diese Dateien stehen
  einzeln im letzten `overrides`-Block von `.oxlintrc.json` und sehen die vier
  Regeln als `warn` — überall sonst (also in jedem neuen Spiel) bleiben sie
  `error`. Wer eine dieser Dateien bereinigt, streicht sie aus der Liste; neue
  Dateien kommen nie dazu.
- **Die Token-Migration ist im Chrome fertig, in `src/components/*Game.tsx` nur
  für Text und Rahmen.** Hintergründe sind dort nicht angefasst, weil dieselbe
  Klassenkombination je nach Datei Chrome *oder* Spielfeld bedeutet und sich das
  nicht mechanisch unterscheiden lässt. Wer ein Spiel anfasst, migriert dessen
  Hintergründe von Hand mit — und prüft das Ergebnis im Browser.
