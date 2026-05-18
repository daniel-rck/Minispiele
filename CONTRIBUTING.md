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
3. **Route registrieren** in [`src/App.tsx`](./src/App.tsx) als `<Route>` innerhalb des `AppShell` — bestehende Einträge zeigen das Muster für Lazy-Loading via `LazyRoute`.
4. **Preview-Asset** unter `public/games/<slug>-preview.svg` ablegen (siehe vorhandene Previews).
5. **Tests** schreiben:
   - Unit: `src/pages/<DeinSpiel>.test.tsx` mit Vitest + Testing Library.
   - E2E-Smoke: in `e2e/` einen Test, der die Route lädt und einen Interaktions-Happy-Path durchspielt.
6. **LocalStorage** immer mit Zod-Schema validieren — Vorlage in [`src/hooks/useFavorites.ts`](./src/hooks/useFavorites.ts) und [`src/lib/crossGameSchemas.ts`](./src/lib/crossGameSchemas.ts).

## Coding Standards

- **Prettier** läuft als pre-commit-Hook (via `simple-git-hooks` + `lint-staged`) — kein manuelles Formatieren nötig.
- **ESLint** strikt: `bun run lint` muss grün sein. JSX-a11y-Regeln sind aktiv.
- **TypeScript** strict: `bun run typecheck`. Keine `any`, keine impliziten Typen.
- **Accessibility:** Touch-Targets ≥ 44 px, semantische `<button>`-Elemente statt `div onClick`, sichtbarer Fokus-Ring, Tastaturbedienung möglich.
- **Bundle-Budget:** Der main chunk darf 250 KB nicht überschreiten — bei größeren Spielen Lazy-Loading via `React.lazy` nutzen (siehe `LazyRoute` in [`src/App.tsx`](./src/App.tsx)).
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
