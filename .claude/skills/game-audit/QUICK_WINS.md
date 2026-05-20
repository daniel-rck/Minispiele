# Quick-Wins — automatisch anwenden

Nur die hier gelisteten Änderungen darf der Skill automatisch ins Working-Tree schreiben. Alles andere → nur Befund im Report. Vor jeder Aktion prüfen, ob die Bedingung noch zutrifft (Idempotenz).

---

## QW-1: Biome-Formatierung

**Bedingung**: Datei wurde im Audit gelesen oder verändert.

**Aktion**: `bunx biome format --write <files>` als letzter Schritt nach allen anderen Quick-Wins (oder `bunx biome check --write <files>` für Format + safe Lint-Fixes).

**Risiko**: keins — pre-commit-Hook (lint-staged → `biome check --write`) würde das ohnehin tun.

---

## QW-2: Fehlende `aria-label` an Icon-Buttons

**Bedingung**:

- `<IconButton ...>` oder `<button ...>` mit ausschließlich Icon-/SVG-Inhalt (keine sichtbare Textbeschriftung)
- Kein `aria-label`, `aria-labelledby`, `title` attribut gesetzt

**Aktion**: `aria-label="<Default>"` einfügen. Default aus Kontext ableiten:

- Wenn umgebende Funktion `pause`, `reset`, `restart`, `close`, `help`, `settings` heißt → entsprechendes deutsches Label („Pause", „Zurücksetzen", „Neu starten", „Schließen", „Hilfe", „Einstellungen").
- Wenn `onClick={...handleX}` → aus `handleX` ableiten (camelCase → Wörter).
- Wenn unklar → **kein** Quick-Win, nur Befund.

**Risiko**: niedrig wenn Default eindeutig.

---

## QW-3: `<button>` → `<Button>` Migration (nur einfache Fälle)

**Bedingung**:

- Nativer `<button>` in einer Game-Component
- Verwendet nur Standard-Tailwind-Klassen die `<Button>` ebenfalls bietet
- Kein `type="submit"` (Formular-Sonderfall)
- Kein komplexes Children (z.B. mehrere geschachtelte Wrapper)

**Aktion**:

1. Import ergänzen: `import Button from './ui/Button';` (relativer Pfad, **default export**, anpassen je nach Datei-Tiefe — z.B. `'../components/ui/Button'` aus `src/pages/`).
2. `<button className="..." onClick={...}>Text</button>` → `<Button onClick={...} variant="primary">Text</Button>`
3. Variant-Wahl: Wenn Klassen `bg-primary`/`bg-cyan` enthalten → `primary`; `bg-accent`/`bg-orange` → `accent`; `bg-red`/`bg-danger` → `danger`; `bg-green`/`bg-success` → `success`; sonst → **kein** Quick-Win.

**Risiko**: mittel — bei Unsicherheit ÜBERSPRINGEN, als Befund melden.

---

## QW-4: Hardcoded Tailwind-Farben → Design-Token

**Bedingung**:

- Tailwind-Standard-Farbklasse (`text-cyan-500`, `bg-orange-400`, `border-red-500` etc.)
- Eindeutiges Token-Mapping aus folgender Tabelle:

| Tailwind                    | Token-Klasse                  |
| --------------------------- | ----------------------------- |
| `text-cyan-{400,500,600}`   | `text-[var(--color-primary)]` |
| `bg-cyan-{400,500,600}`     | `bg-[var(--color-primary)]`   |
| `text-orange-{400,500,600}` | `text-[var(--color-accent)]`  |
| `bg-orange-{400,500,600}`   | `bg-[var(--color-accent)]`    |
| `text-green-{400,500,600}`  | `text-[var(--color-success)]` |
| `bg-green-{400,500,600}`    | `bg-[var(--color-success)]`   |
| `text-yellow-{400,500,600}` | `text-[var(--color-warning)]` |
| `bg-yellow-{400,500,600}`   | `bg-[var(--color-warning)]`   |
| `text-red-{400,500,600}`    | `text-[var(--color-danger)]`  |
| `bg-red-{400,500,600}`      | `bg-[var(--color-danger)]`    |

**Aktion**: nur die exakten Mappings oben anwenden. Alle anderen Farbklassen → nur Befund.

**Risiko**: niedrig — Token sind kompatibel und der eigentliche Sinn der Design-Tokens.

---

## QW-5: `GameLayout`-`description` aufwerten

**Bedingung**:

- Spiel rendert `<GameLayout title="..." description={...}>` oder `description="..."`
- Beschreibung ist `undefined`, leerer String, oder < 60 Zeichen
- Eintrag in `gamesCatalog.ts` hat eine längere `description`

**Aktion**:

- Bevorzugt: `description={gamesCatalog.find(g => g.slug === "<slug>")?.description}` einsetzen.
- Alternativ: längere Description aus Catalog hart einsetzen, ergänzt um Steuerungshinweis („Wische oder Pfeiltasten").
- Wenn Catalog-Description auch < 60 Zeichen → **kein** Quick-Win, Befund.

**Risiko**: niedrig.

---

## QW-6: Test-Skeleton anlegen

**Bedingung**:

- `src/lib/<slug>.ts` existiert
- `src/lib/<slug>.test.ts` existiert **nicht**

**Aktion**: Datei anlegen mit Minimal-Skeleton:

```ts
import { describe, it, expect } from 'vitest';

// TODO(game-audit): Tests für src/lib/<slug>.ts ergänzen.
// Empfohlen: pure Game-Logic-Funktionen (Zustandsübergänge, Win/Lose, Validierung).

describe('<slug>', () => {
  it.todo('hat noch keine Tests');
});
```

**Risiko**: keins — Skeleton mit `it.todo` macht keine Test-Suite kaputt.

---

## QW-7: `AriaLive`-Import + Platzhalter

**Bedingung**:

- Game-Component hat einen Score- oder Status-State (heuristisch: State namens `score`, `lives`, `level`, `gameOver`, `won`)
- Kein Import von `AriaLive` (`from .../AriaLive`)

**Aktion**:

1. Import einfügen: `import AriaLive from './AriaLive';` (relativer Pfad, **default export**, `AriaLive` liegt direkt unter `src/components/`, nicht unter `ui/`).
2. Direkt vor dem `</GameLayout>` (oder am Ende des Render-Trees) einfügen:
   ```tsx
   {/* TODO(game-audit): konkrete Status-Nachrichten ergänzen — z.B. `${score} Punkte` oder "Spiel beendet". */}
   <AriaLive message="" />
   ```

**Risiko**: niedrig — leere `message` macht keine Announcement.

---

## Reihenfolge

1. QW-2 bis QW-7 in beliebiger Reihenfolge anwenden.
2. **Zum Schluss** QW-1 (Biome-Format) über alle veränderten Dateien.

## Was NICHT als Quick-Win

- Eigene `Sheet`-Implementierung durch `Sheet`-Komponente ersetzen → Architektur-Refactor, riskant.
- Storage-Migration `localStorage.getItem` → `useLocalStorage` → Logik-Änderung, riskant.
- WASD-Keys ergänzen → Pattern unterschiedlich pro Spiel, im Report empfehlen.
- Komponenten splitten (z.B. DiceRoller 493 Zeilen) → Architektur, im Report empfehlen.
- Eigene CSS-Klassen entfernen und durch Tailwind ersetzen → Verhalten kann brechen.
- Magic-Number-Konstanten extrahieren → Stilfrage.
- `useMemo`/`useCallback` einfügen → Performance-Annahme, kein automatischer Fix.
