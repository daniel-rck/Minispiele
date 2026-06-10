# Beitragen

Schön, dass du mithelfen willst. Bug-Reports, Feature-Vorschläge und neue Spiele sind willkommen.

## Vor dem ersten Code-Beitrag

- **Bug melden:** [Neues Bug-Issue öffnen](https://github.com/daniel-rck/Minispiele/issues/new?template=bug_report.yml).
- **Neues Spiel vorschlagen:** [Spielvorschlag öffnen](https://github.com/daniel-rck/Minispiele/issues/new?template=new-game.yml) — dort steht auch, was gut zur Sammlung passt (lokal, mobile-first, kurze Sessions).
- Größere Features bitte erst per Issue diskutieren, bevor du Zeit in einen PR steckst.

## Lokales Setup

Du brauchst [Bun](https://bun.sh) (≥ 1.0).

```sh
git clone https://github.com/daniel-rck/Minispiele.git
cd Minispiele
bun install
bun run dev   # → http://localhost:5173
```

Tests laufen mit `bun run test` (Unit) bzw. `bun run test:e2e` (Playwright).

## Ein neues Spiel implementieren

1. **Komponente anlegen** in `src/pages/<DeinSpiel>.tsx` und in [`<GameLayout>`](./src/components/GameLayout.tsx) wrappen — damit erbt das Spiel Header, Back-Button und a11y-Landmarks automatisch.
2. **Katalog-Eintrag** in [`src/lib/gamesCatalog.ts`](./src/lib/gamesCatalog.ts) ergänzen (`to`, `title`, `description`, `preview`, `previewAlt`, `category`). Das ist die Single Source of Truth — Home, Suche und Kategorien lesen alles daraus.
3. **Route registrieren**: Pfad-Konstante in [`src/lib/routes.ts`](./src/lib/routes.ts) ergänzen und die Route in [`src/lib/router.tsx`](./src/lib/router.tsx) unter dem AppShell-Eintrag als `lazy: lazyPage(() => import('../pages/<DeinSpiel>.tsx'))` registrieren — bestehende Einträge zeigen das Muster.
4. **Preview-Asset** unter `public/games/<slug>-preview.svg` ablegen (siehe vorhandene Previews).
5. **Tests** schreiben:
   - Unit: `src/pages/<DeinSpiel>.test.tsx` mit Vitest + Testing Library.
   - E2E-Smoke: in `e2e/` einen Test, der die Route lädt und einen Interaktions-Happy-Path durchspielt.
6. **LocalStorage** immer mit Zod-Schema validieren — Vorlage in [`src/hooks/useFavorites.ts`](./src/hooks/useFavorites.ts) und [`src/lib/crossGameSchemas.ts`](./src/lib/crossGameSchemas.ts).

## Coding Standards

- **Biome** formatiert als pre-commit-Hook (via `simple-git-hooks` + `lint-staged`) — kein manuelles Formatieren nötig.
- **Biome** strikt: `bun run lint` muss grün sein. A11y-Lint-Regeln sind aktiv.
- **TypeScript** strict: `bun run typecheck`. Keine `any`, keine impliziten Typen.
- **Accessibility:** Touch-Targets ≥ 44 px, semantische `<button>`-Elemente statt `div onClick`, sichtbarer Fokus-Ring, Tastaturbedienung möglich.
- **Bundle-Budget:** Der main chunk sollte 270 KB nicht überschreiten — bei Überschreitung loggt CI eine Warnung (kein Hard-Fail). Alle Routen laden ohnehin lazy über `lazyPage` in [`src/lib/router.tsx`](./src/lib/router.tsx) — jedes Spiel landet automatisch in einem eigenen Chunk.
- **Mobile-first:** Layout muss auf 320 px Breite funktionieren. Touch zuerst, Maus/Tastatur danach.

## PR-Checkliste

- [ ] `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build` lokal grün
- [ ] E2E-Test hinzugefügt (bei neuem Spiel oder Routing-Änderung)
- [ ] Eintrag in `src/lib/gamesCatalog.ts` (bei neuem Spiel)
- [ ] Screenshot oder GIF im PR (bei UI-Änderungen)
- [ ] Bundle-Budget eingehalten — CI meldet sich, falls nicht

## Commit-Stil

Kurze, imperative Subjects auf Deutsch oder Englisch (`fix snake collision`, `add tangram pieces`). Conventional Commits sind nicht erzwungen — Hauptsache nachvollziehbar im `git log`.

## PR-Prozess

PR gegen `main`, Cloudflare Workers baut automatisch eine Preview. CI muss grün sein, dann reviewt der Maintainer und merged.
