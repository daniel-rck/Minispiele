# Report-Vorlage

## Variante A — Einzelnes Spiel (Standardmodus)

```markdown
# Audit: <Spiel-Titel> (`<slug>`)

**Dateien**: `src/pages/<X>.tsx` · `src/components/<X>Game.tsx` · `src/lib/<slug>.ts`
**Kategorie**: <category> · **Route**: `/<slug>`

## Zusammenfassung

🔴 **<N>** kritisch · 🟡 **<M>** warnung · 🔵 **<K>** info · ⚡ **<Q>** Quick-Wins angewendet

> <Ein-Satz-Gesamteinschätzung — z.B. "Solides Spiel mit kleinen Style-Inkonsistenzen und fehlenden a11y-Labels.">

---

## Befunde nach Kategorie

### 1. Globaler einheitlicher Style — <Status-Emoji>

- 🔴 `src/components/SnakeGame.tsx:142` — Hardcoded `#22d3ee` statt `var(--color-primary)`. **Fix**: durch `text-[var(--color-primary)]` ersetzen.
- 🟡 `src/pages/Snake.tsx:18` — `<GameLayout>` ohne `category`-Prop. **Fix**: `category="action"` ergänzen (aus `gamesCatalog.ts`).

### 2. Wiederverwendung — <Status-Emoji>

- 🟡 `src/components/SnakeGame.tsx:201` — Nativer `<button>` für „Neu starten". **Fix**: `<Button variant="primary">` aus `ui/Button.tsx`.

### 3. Mobile / Touch-Integration — <Status-Emoji>

- ✅ Touch-Handler vorhanden (Swipe via `TouchStart/Move/End`).

### 4. Steuerung / Bedienung — <Status-Emoji>

- 🟡 Keine WASD-Alternative zu Pfeiltasten. **Fix**: `KEY_TO_DIR` Map um `w/a/s/d` erweitern.

### 5. Spielanleitung / Hinweise — <Status-Emoji>

- ✅ `description` aussagekräftig.
- 🔵 Kein In-Game-Hilfe-Sheet — bei Snake nicht zwingend.

### 6. Accessibility & Farbblind-Modus — <Status-Emoji>

- 🔴 `src/components/SnakeGame.tsx:87` — IconButton ohne `aria-label`. ⚡ **Quick-Win angewendet** (Label: „Pause").

### 7. Code-Architektur & Persistenz — <Status-Emoji>

- ✅ Pure Logic in `src/lib/snake.ts` separiert.
- ✅ LocalStorage über `useLocalStorage` + `STORAGE_KEYS.SNAKE_BEST`.

### 8. Tests, Bundle-Budget & Performance — <Status-Emoji>

- ✅ Unit-Test in `src/lib/snake.test.ts`.
- 🔵 Component-Test in `src/components/SnakeGame.test.tsx` fehlt.

### 9. Audio, Haptik & Settings-Respekt — <Status-Emoji>

- ✅ Vibration mit Settings-Check.

### 10. Sonstige Best Practices — <Status-Emoji>

- ✅ Sprache konsistent Deutsch, du-Form.

---

## Angewandte Quick-Wins (⚡)

- ✅ **Biome-Format** auf 3 Dateien (`SnakeGame.tsx`, `Snake.tsx`, `snake.test.ts`)
- ✅ **aria-label** an IconButton (`SnakeGame.tsx:87`, Label: „Pause")
- ✅ **`<button>` → `<Button>`** (`SnakeGame.tsx:201`)
- ✅ **Test-Skeleton** angelegt (`src/lib/snake.test.ts` — falls noch nicht vorhanden)

---

## Empfohlene nächste Schritte

1. **Manuell zu fixen** (zu riskant für Quick-Win):
   - Eigenes Modal in `SnakeGame.tsx:340` durch `Sheet` ersetzen.
2. **Tests ergänzen**:
   - Component-Test für `SnakeGame`.
3. **Steuerung verbessern**:
   - WASD-Mapping für Tastatur.

---

## Verifikation

- Bitte `bun run lint` lokal ausführen, um die Quick-Win-Änderungen zu prüfen.
- Diff: `git diff src/components/SnakeGame.tsx src/pages/Snake.tsx`
- Erst nach manuellem Review commiten.
```

---

## Variante B — Sweep-Modus (`--all`)

```markdown
# Game-Audit Sweep — <N> Spiele

**Lint-/Typecheck-Lauf**: ✅ projektweit grün (oder: ⚠️ N Fehler — siehe Pro-Spiel-Details)
**Quick-Wins gesamt**: ⚡ <Q> angewendet auf <D> Dateien

## Heatmap

Zelle = schlimmste Severity der Kategorie für das Spiel.
🟢 = sauber (nur 🔵 oder keine Befunde) · 🟡 = mind. eine Warnung · 🔴 = mind. ein kritischer Befund

**Spalten-Legende**: 1=Style · 2=UI-Reuse · 3=Touch · 4=Bedienung · 5=Anleitung · 6=a11y · 7=Arch · 8=Tests · 9=Audio · 10=Sonst · 11=Leben · 12=Pause · 13=Replay · 14=Empty/Err · 15=Juice/Share

| Spiel |  1  |  2  |  3  |  4  |  5  |  6  |  7  |  8  |  9  | 10  | 11  | 12  | 13  | 14  | 15  | ⚡QW |
| ----- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | ---: |
| Snake | 🟡  | 🟡  | 🟢  | 🟡  | 🟢  | 🔴  | 🟢  | 🔵  | 🟢  | 🟢  | 🟡  | 🟢  | 🟡  | 🟢  | 🟡  |    3 |
| 2048  | 🟢  | 🟢  | 🟢  | 🟡  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟢  | 🟡  | 🟢  | 🟡  |    1 |
| …     |  …  |  …  |  …  |  …  |  …  |  …  |  …  |  …  |  …  |  …  |  …  |  …  |  …  |  …  |  …  |    … |

## Top-5 Handlungsbedarf

1. **DiceRoller** — 4🔴, 7🟡: monolithische Komponente, fehlende GestureLayer, Architektur-Split empfohlen.
2. **<Spiel>** — …
3. …

## Häufigste Befund-Pattern (projektweit)

- **Hardcoded Tailwind-Farben** in N Spielen → Token-Migration via Quick-Win wo eindeutig.
- **Fehlende WASD-Alternative** in M richtungsbasierten Spielen.
- **`<button>` statt `<Button>`** in K Stellen.
- **Fehlende `AriaLive`** in J Spielen mit Score-State.

## Quick-Wins nach Typ

| Typ                       | Anzahl |
| ------------------------- | -----: |
| Biome-Format              |    <P> |
| aria-label ergänzt        |    <A> |
| `<button>` → `<Button>`   |    <B> |
| Hardcoded Farbe → Token   |    <C> |
| `description` aufgewertet |    <D> |
| Test-Skeleton angelegt    |    <T> |
| AriaLive-Platzhalter      |    <L> |

## Pro-Spiel-Details

<details>
<summary>Snake — 🔴1 🟡3 🔵1 ⚡3</summary>

(eingeklappter Mini-Report im Format von Variante A, gekürzt — nur Befunde + Quick-Wins, keine Verifikation-Sektion)

</details>

<details>
<summary>2048 — 🟡1 ⚡1</summary>

…

</details>

(… 31 Details …)

---

## Verifikation

- `git status` zeigt veränderte Dateien.
- `bun run lint` und `bun run typecheck` zum Bestätigen lokaler Konsistenz.
- Pro-Spiel-Diffs mit `git diff <pfad>` reviewen.
- Erst nach manuellem Review commiten.
```

---

## Status-Emoji-Logik

Pro Kategorie im Report-Header:

- Mindestens ein 🔴 → 🔴
- Sonst mindestens ein 🟡 → 🟡
- Sonst (nur 🔵 oder leer) → 🟢

Wenn die Kategorie keine Befunde produziert: einzeiliges `✅ <kurze positive Feststellung>`.
