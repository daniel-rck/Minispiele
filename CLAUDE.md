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
bun run check       # Biome (lint + format)
bun run typecheck   # tsc (App + SW + Worker)
bun run test        # Vitest
bun run build       # SPA + PWA
bun run test:e2e    # Playwright (Smoke pro Spiel)
```

## Konventionen (gemäß web-base)

- **Bun** als Runtime & Package-Manager (kein npm/yarn-Lockfile).
- **Biome** für Lint + Format. `biome.base.json` kommt aus web-base und wird bei
  `update` überschrieben; app-eigene Regeln gehören in `biome.json` (`extends`).
- **TypeScript strict** inkl. `noUncheckedIndexedAccess`;
  `verbatimModuleSyntax` (→ `import type`); `type` statt `interface`.
- **Deutsche UI + README, englischer Quellcode** (Bezeichner, Kommentare,
  Commits, Doku).
- **Design-Tokens statt Roh-Paletten** im Chrome: `bg-surface`, `text-fg-muted`,
  `border-border` … aus `src/lib/ui/theme.css`. Für Spielfarben gilt das
  ausdrücklich **nicht** — siehe unten.
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
- **`noArrayIndexKey` und `useSemanticElements` sind in `src/components/*Game.tsx`
  (plus DiceRoller/TimerDisplay/SettingsSheet) abgeschaltet**, mit Begründung:
  in einem Sudoku- oder Nonogramm-Gitter *ist* der Index die Identität einer
  Zelle, und `role="grid"` auf einem CSS-Grid ist die richtige ARIA-Rolle — die
  Regel will ein `<table>`, das hier den ganzen Aufbau sprengen würde. In der
  Shell, in `src/pages/` und in `src/components/ui/` gelten beide Regeln
  weiterhin als `error`. **Die Abschaltung nicht ausweiten.**
- **`todo/` ist vendored**: self-contained HTML-Spiele, die noch nicht portiert
  sind (siehe Skill `import-foreign-game`). In `biome.json` ausgenommen — nicht
  formatieren, nicht linten, wortwörtlich lesen.
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
- **Akzent ist `--accent-h: 195`** (Türkis). Der Wert steht jetzt direkt in
  `theme.css`; das alte Override in `index.css` war ein veraltetes Scaffold.
- **Bundle-Budget**: die CI warnt ab 270 KB Main-Chunk. Neue Spiele lazy laden.

## Bewusste Abweichungen

- **Eigene CI statt des reusable `web-app-ci.yml`.** Der Job hier macht
  dieselben vier Gates plus Bundle-Budget und Playwright-E2E; der geteilte
  Workflow kann das nicht. `web-base-check` läuft daneben.
- **Kein `AppShell`/`AppNav`/`PageHeader`.** Die App komponiert ihre Shell in
  `src/components/AppShellRoute.tsx`; die drei Dateien lagen ungenutzt in
  `src/lib/ui/` und sind entfernt. Übernommen sind `AppHeader` (mit
  `maxWidthClass="max-w-7xl"`), `InstallButton` und `primitives`.
- **Kein `useTheme` aus web-base** — das Theme hängt am Settings-Blob, siehe oben.

## Offene Punkte

- Rund 200 `noNonNullAssertion`-Warnungen (Kanon: `warn`) — Altbestand, beim
  Anfassen einer Datei jeweils mitaufräumen.
- **Die Token-Migration ist im Chrome fertig, in `src/components/*Game.tsx` nur
  für Text und Rahmen.** Hintergründe sind dort nicht angefasst, weil dieselbe
  Klassenkombination je nach Datei Chrome *oder* Spielfeld bedeutet und sich das
  nicht mechanisch unterscheiden lässt. Wer ein Spiel anfasst, migriert dessen
  Hintergründe von Hand mit — und prüft das Ergebnis im Browser.
