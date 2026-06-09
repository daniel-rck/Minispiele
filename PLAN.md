# Deep Fixup — Plan & Fortschritt (2026-06-09)

Ergebnis der Deep-Fixup-Analyse (Core-Infrastruktur, Doku/Dependencies, Spiele-Sweep): Repo sehr gesund, Baseline komplett grün. Es bleiben ein verifizierter Bug, eine ungenutzte Dependency und Doku-Drift.

**Full-Verification der Session:**

```sh
bun run lint && bun run format:check && bun run typecheck && bun run test && bun run build
```

Baseline vor Start: alles grün (93 Testdateien, 687 Tests). Branch: `claude/deep-fixup-z0nb7i`.

## Tasks

- [x] T1: PipePuzzle — verzerrten Shuffle durch Fisher-Yates ersetzen
      Files: `src/components/PipePuzzleGame.tsx:34`
      Change: `[...dirs].sort(() => Math.random() - 0.5)` ist ein verzerrter Shuffle (nicht-uniforme Permutationen → statistisch verzerrte Spannbäume bei der Puzzle-Generierung). Ersetzen durch In-place-Fisher-Yates auf der Kopie, analog `shuffleArr` in `FutoshikiGame.tsx`/`HitoriGame.tsx`. Die ~8 weiteren lokalen Fisher-Yates-Kopien in `src/lib/*` sind korrekt (seedbares `rng`) — bewusste Konvention, nicht konsolidieren.
      Verify: `bun run test && bun run typecheck && bun run lint`

- [x] T2: Ungenutzte devDependency `@axe-core/react` entfernen
      Files: `package.json`, `bun.lock`
      Change: `"@axe-core/react"` aus devDependencies löschen, `bun install`. Kein Import im Repo; a11y-Tests nutzen `axe-core` direkt (`src/test/a11y.ts`). `workbox-window` bleibt — wird von `virtual:pwa-register` dynamisch importiert (required peerDependency von vite-plugin-pwa).
      Verify: `bun install && bun run test && bun run build`

- [x] T3: README.md — Tool-/Versions-Drift beheben
      Files: `README.md` (Zeilen 22, 50, 66–67, 83)
      Change: TypeScript-Badge 5.7 → 6; Text „TypeScript 5.7 + Vite 7" → „TypeScript 6 + Vite 8"; Dev-Befehle-Tabelle `lint`/`format` von „ESLint"/„Prettier" auf Biome korrigieren; CI-Pipeline-Beschreibung an `.github/workflows/ci.yml` angleichen (`check` = Biome Lint + Format, kein separates `format:check`/`lint`).
      Verify: `bun run lint` + Sichtprüfung

- [x] T4: CONTRIBUTING.md — tote Pfade und Tool-Namen korrigieren
      Files: `CONTRIBUTING.md` (Zeilen 28, 37–38, 41)
      Change: `src/App.tsx` und `LazyRoute` existieren nicht — Route-Registrierung korrekt beschreiben (`src/lib/routes.ts` + `lazyPage` in `src/lib/router.tsx`); „Prettier"/„ESLint" → Biome.
      Verify: `bun run lint` + referenzierte Dateipfade existieren

## Abschluss

- [x] Full-Verification grün (lint, format:check, typecheck, 687/687 Tests, build)
- [x] Push + Draft-PR

## Not this session

- `status.md`: bewusste Roadmap-Notiz (datiert 2026-05-17); historische Zahlen sind Kontext, kein Drift-Fix wert.
- Konsolidierung der lokalen `shuffle`-Helfer in `src/lib/*`: bewusste Per-Modul-Konvention (seedbares `rng`).
- Build-Deprecation-Warnungen: Upstream (`@vitejs/plugin-react` braucht Babel für React Compiler; `vite-plugin-pwa`), nicht unsere Config.
- `todo/`-Ordner: bewusste Staging-Area für den `import-foreign-game`-Skill.
