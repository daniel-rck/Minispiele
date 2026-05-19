# Audit-Checkliste — 15 Kategorien

Pro Kategorie: Was prüfen, mit welchen Patterns, Severity-Mapping.

**Severity-Logik**:
- 🔴 **kritisch** — bricht UX/a11y/Konsistenz so stark, dass PR blockiert sein sollte.
- 🟡 **warnung** — sollte vor Release gefixt werden.
- 🔵 **info** — Verbesserungsidee, kein Blocker.

---

## 1. Globaler einheitlicher Style

### Was prüfen
- Verwendet das Spiel Design-Tokens aus `src/index.css`?
- Wird der korrekte Kategorie-Akzent gesetzt?
- Tailwind utility-classes statt Inline-Styles oder eigener CSS-Klassen?

### Pattern (grep im Datei-Set)
| Pattern | Severity | Hinweis |
|---|---|---|
| `#[0-9a-fA-F]{3,8}\b` in `.tsx` (außer SVG-Inline) | 🔴 | Hardcoded Hex-Farbe — Design-Token verwenden |
| `rgb\(`, `rgba\(`, `hsl\(` in `.tsx` | 🔴 | Hardcoded Farb-Funktion |
| `style=\{\{ *(color\|background\|backgroundColor):` | 🟡 | Inline-Style für Farben — Tailwind/Token nutzen |
| `text-(cyan\|orange\|red\|green)-[0-9]+` | 🟡 | Tailwind-Standard-Farbe statt semantischem Token |
| `<GameLayout` ohne `category` prop | 🟡 | Kategorie-Akzent fehlt |
| `category="..."` ≠ Eintrag in `gamesCatalog.ts` | 🔴 | Inkonsistenz |

### Quelle der Wahrheit
- `src/index.css` definiert: `--color-primary`, `--color-accent`, `--color-success`, `--color-warning`, `--color-danger`, `--surface-*`, Kategorie-Akzente `--category-<name>`.

---

## 2. Wiederverwendung der UI-Komponenten

### Was prüfen
- Werden bestehende UI-Komponenten genutzt statt selbst gebaut?

### Pattern
| Pattern | Severity | Hinweis |
|---|---|---|
| `<button\b` (lowercase) in Spiel-Component | 🟡 | Statt nativ `<Button>` aus `src/components/ui/Button.tsx` |
| Eigene Modal-Implementierung (`role="dialog"`, eigenes Backdrop) | 🔴 | `Sheet` aus `src/components/ui/Sheet.tsx` verwenden |
| Hand-gerollte Score/Timer-Box | 🟡 | `GameStats` aus `src/components/ui/GameStats.tsx` |
| Eigene Switch/Toggle-Implementierung | 🟡 | `Switch` aus `src/components/ui/Switch.tsx` |
| Eigene Chip/Badge/Pill-Implementierung | 🟡 | `Chip`, `Badge` aus `src/components/ui/` |
| Icon-Button ohne `IconButton`-Wrapper | 🔵 | `IconButton` für 44px-Garantie |

### Vorgehen
- Grep nach `<button` und prüfe pro Treffer: ist das ein 1:1-Ersatz für `<Button>`? Wenn ja → Quick-Win (siehe QUICK_WINS.md). Wenn nein (komplexes Styling-Override) → 🟡 Befund.
- Bei eigenen Modals: Pattern `setIsOpen` + fixed-overlay + role="dialog" → Hinweis auf `Sheet`.

---

## 3. Mobile / Touch-Integration

### Was prüfen
- Touch-Events vorhanden für interaktive Bereiche?
- Touch-Targets ≥ 44px?
- 320px-Layout funktioniert?
- Keine Hover-only Interaktionen?

### Pattern
| Pattern | Severity | Hinweis |
|---|---|---|
| Spiel verarbeitet `onMouseDown/onClick` aber kein `onTouchStart/onPointerDown` | 🔴 | Touch fehlt |
| `w-\[(\d{3,4})px\]` oder `min-w-\[(\d{3,4})px\]` ≥ 320 | 🟡 | Layout sprengt mobile Breite |
| Buttons ohne `min-h-11` / `min-w-11` und kleiner Inhalt | 🟡 | Touch-Target evtl. < 44px |
| `:hover` ohne `:active` / `:focus-visible` Pendant | 🔵 | Hover-only Bedienung |
| Fehlendes `touch-action: none` bei Drag-Zonen | 🔵 | Verhindert Pull-to-Refresh-Konflikte |
| `onDoubleClick` als einzige Interaktion | 🔴 | Auf Touch unzuverlässig |

### Vorgehen
- Wenn das Spiel Drag/Swipe-basiert ist (Snake, 2048, Sokoban, Sudoku-Drag), prüfe explizit Pointer- oder Touch-Handler.
- Buttons aus `<Button>`/`<IconButton>` haben 44px garantiert (Coarse-Pointer-Override in `index.css`). Custom-Buttons → manuell prüfen.

---

## 4. Steuerung / Bedienung

### Was prüfen
- Keyboard, Touch, Maus konsistent?
- Pause/Reset vorhanden?
- Focus-Management?

### Pattern
| Pattern | Severity | Hinweis |
|---|---|---|
| Richtungsspiel (Snake, 2048, Sokoban) ohne WASD-Alternative zu Arrow-Keys | 🟡 | WASD-Mapping ergänzen |
| Modal/Sheet ohne `Escape`-Close | 🟡 | UX-Standard |
| Bestätigung-Button ohne `Enter`-Trigger | 🔵 | |
| Kein Pause/Reset bei zeitkritischem Spiel | 🟡 | |
| Doppel-Input nicht entkoppelt (z.B. zwei `ArrowKey`-Events in einem Tick) | 🔵 | Direction-Queue-Pattern wie in `src/lib/snake.ts` |
| `tabIndex={-1}` auf interaktivem Element | 🔴 | Tastatur-Reichweite verloren |

### Vorgehen
- Liste der „richtungsbasierten" Spiele: Snake, 2048, Sokoban, Sudoku, Verbinden, Sudoku, Kistenschieber. Bei denen WASD-Pflicht.

---

## 5. Spielanleitung / Hinweise

### Was prüfen
- `GameLayout`-`description` aussagekräftig?
- In-Game-Hilfe für komplexe Spiele?
- `AriaLive` für wichtige Statusänderungen?

### Pattern
| Pattern | Severity | Hinweis |
|---|---|---|
| `GameLayout` `description` < 60 Zeichen oder fehlt | 🟡 | Ziel + Steuerung in einem Satz |
| Komplexes Spiel (Sokoban/Sudoku/Mastermind/Tangram/FreeCell) ohne Hilfe-Sheet | 🟡 | „Wie spielt man?" Sheet ergänzen |
| Score-/Game-Over-State ohne `AriaLive`-Announcement | 🟡 | `src/components/AriaLive.tsx` einbinden |
| Anleitung enthält Englisch-Begriffe ohne deutsche Übersetzung | 🔵 | |

### Komplexitätsliste (Hilfe-Sheet empfohlen)
Sokoban (Kistenschieber), Sudoku, Mastermind (Codeknacker), Tangram, FreeCell, Nonogram (Bildrätsel), Stau, Gfrett, Flow (Verbinden), Hyperfokus.

---

## 6. Accessibility & Farbblind-Modus

### Pattern
| Pattern | Severity | Hinweis |
|---|---|---|
| `<div onClick=` als Interaktiv-Element | 🔴 | semantisch `<button>` / `<Button>` |
| `<button>` ohne sichtbaren Text und ohne `aria-label` | 🔴 | Icon-Buttons brauchen Label |
| `outline:\s*none` ohne Ersatz-Focus-Style | 🔴 | Focus-Ring verloren |
| Animation/Transition ohne `prefers-reduced-motion` Respekt | 🟡 | siehe `index.css` Pattern |
| Status nur durch Farbe (z.B. roter vs. grüner Hintergrund ohne Symbol/Form) | 🟡 | Farbblind-unfreundlich |
| Toggle ohne `aria-pressed` | 🟡 | |
| Live-Region ohne `role="status"` / `aria-live` | 🟡 | |

### Vorgehen
- Bei Mastermind, Lichter aus, Memory, Simon: Farbe ist Gameplay-relevant → mit Form/Symbol-Empfehlung markieren.
- Kontrast nur stichprobenartig prüfen (manueller Hinweis).

---

## 7. Code-Architektur & Persistenz

### Pattern
| Pattern | Severity | Hinweis |
|---|---|---|
| Game-Logik komplett in React-Component (kein `src/lib/<slug>.ts`) bei nicht-trivialer Logik | 🟡 | Pure Logic extrahieren |
| `: any` (außer in `node_modules` oder als bewusster Cast mit Kommentar) | 🟡 | TypeScript-Strict-Bruch |
| `@ts-ignore` / `@ts-expect-error` ohne Kommentar | 🟡 | |
| `localStorage.getItem` / `localStorage.setItem` direkt | 🔴 | `useLocalStorage` + Zod nutzen |
| Storage-Key als String-Literal (nicht aus `STORAGE_KEYS`) | 🟡 | `src/lib/constants.ts` |
| Route in `App.tsx` ist nicht `lazy()`-loaded | 🟡 | Bundle-Budget |
| Eintrag in `gamesCatalog.ts` unvollständig (fehlt slug/title/description/category/route/previewSvg) | 🔴 | |
| Preview-SVG fehlt: `public/games/<slug>-preview.svg` | 🟡 | |

### Vorgehen
- Lies `src/lib/gamesCatalog.ts`, finde das Spiel, prüfe Vollständigkeit der Felder.
- Lies `src/App.tsx`, prüfe ob die Route `React.lazy(() => import(...))` verwendet.

---

## 8. Tests, Bundle-Budget & Performance

### Pattern
| Pattern | Severity | Hinweis |
|---|---|---|
| `src/lib/<slug>.ts` existiert aber `src/lib/<slug>.test.ts` fehlt | 🟡 | Unit-Test fehlt |
| `src/components/<Game>Game.tsx` ohne Component-Test | 🔵 | |
| Kein E2E-Smoke-Test in `e2e/` der das Spiel öffnet | 🔵 | |
| Datei > 600 Zeilen | 🟡 | Komponenten-Split erwägen |
| `setInterval(` in Game-Component (nicht für Anzeige-Timer) | 🟡 | `requestAnimationFrame` |
| Render-Hot-Path: inline Funktion in `onClick={() => ...}` mit teurem State-Update | 🔵 | `useCallback` |
| Großer State ohne `useMemo` bei Re-Render-Häufigkeit | 🔵 | |

### Vorgehen
- Datei-Zeilen mit `wc -l` zählen.
- E2E: `grep -l "<slug>" e2e/*.spec.ts` — wenn 0 Treffer, Befund.

---

## 9. Audio, Haptik & Settings-Respekt

### Pattern — negative (Settings ignoriert / Bugs)
| Pattern | Severity | Hinweis |
|---|---|---|
| `navigator.vibrate(` direkt aufgerufen statt `useVibration()` aus `src/hooks/useVibration.ts` | 🔴 | Hook kapselt Settings-Check + try/catch + isSupported. **Bekannt betroffen**: `src/components/DiceRoller.tsx:122` |
| `useVibration()` verwendet aber Rückgabewert ignoriert (z.B. eigenes `if (settings.vibration)` davor) | 🟡 | Redundanz, Hook übernimmt das |
| Sound-Trigger nicht über `src/lib/audio.ts` / `toneAudio.ts` | 🟡 | Eigenes Audio-Setup |
| Sound-Trigger ohne Check auf `audioSettings.sound` | 🔴 | |
| `requestWakeLock` nicht im `useEffect`-Cleanup released | 🟡 | Battery-Drain |
| `setInterval`/`requestAnimationFrame` ohne Stop auf `visibilitychange → hidden` | 🟡 | Performance |
| Hard-coded Farben in `style={{}}` die Theme-Wechsel brechen | 🔴 | CSS Custom Properties nutzen |

### Pattern — positiv (Vibration sollte vorkommen)
| Spiel-Typ / Event | Severity wenn fehlend | Empfehlung |
|---|---|---|
| Kollision / Game Over (Snake, 2048-Verloren, Breakout-Leben-verloren, Blocks-Top-Out) | 🟡 | kurzer Puls (z.B. `vibrate(80)`) |
| Treffer / Match (Memory-Paar, Bubbles-Pop, Codeknacker-Treffer, Simon-Tap) | 🔵 | sehr kurzer Tap (`vibrate(15)`) |
| Win / Level-Up (Sudoku, Sokoban, Wordle, Tangram, FreeCell) | 🟡 | längeres Muster (`vibrate([60, 40, 120])`) |
| Falsche Eingabe (Wordle-falsches-Wort, Simon-Fehler, Mastermind-Fehler) | 🔵 | doppelter kurzer Puls (`vibrate([40, 60, 40])`) |
| Würfel-Roll / Spinner-Stop | 🔵 | Tap (`vibrate(20)`) |

### Vorgehen
1. **Negative Checks zuerst**: grep nach `navigator.vibrate(` — bei jedem Treffer prüfen, ob `useSettings().vibration` (oder äquivalent) davor abgefragt wird.
2. **Positive Checks**: identifiziere Schlüsselereignisse des Spiels (Game-Over-Branch, Win-Branch, Match-Branch). Wenn dort keine Vibration ausgelöst wird → Befund mit Vorschlag aus der Tabelle oben.
3. **Verwendung des bestehenden Hooks** vorschlagen: `src/hooks/useVibration.ts` existiert bereits und macht Settings-Check + `try/catch` + `isSupported`. Pro Spiel im Code:
   ```tsx
   const { vibrate } = useVibration();
   // ...
   vibrate(80);              // einfacher Puls
   vibrate([60, 40, 120]);   // Win-Pattern
   ```
4. Settings-Toggle prüfen: `src/lib/useSettings.ts` exponiert `settings.vibration` (boolean). SettingsModal muss dafür einen Switch enthalten — wenn das Spiel-Audit feststellt, dass Vibration genutzt wird, aber der Toggle im UI fehlt → 🔴.

### Quellen
- **Vibrations-Hook (zentraler Helper)**: `src/hooks/useVibration.ts`
- Settings-Hook: `src/lib/useSettings.ts`
- Audio-Helper: `src/lib/audio.ts`, `src/lib/audioSettings.ts`, `src/lib/toneAudio.ts`
- Settings-UI: `src/components/SettingsModal.tsx` (oder ähnlich)

---

## 10. Sonstige Best Practices

### Pattern
| Pattern | Severity | Hinweis |
|---|---|---|
| Game-Component nicht von `ErrorBoundary` umgeben (Check `App.tsx`) | 🟡 | |
| `console.log` / `console.warn` im Code (außer mit `// eslint-disable`) | 🟡 | |
| Englisch-Strings in User-facing Texts | 🟡 | Projekt ist Deutsch |
| Du-Form-Bruch (Sie-Form) | 🔵 | |
| Slug ≠ Dateiname-Kebab-Case | 🟡 | Konsistenz |
| Route ≠ `/<slug>` | 🟡 | |

---

## 11. Lebendigkeit — Animationen & Sounds

### Was prüfen
- Hat das Spiel mind. eine taktile Animation auf Spieler-Aktionen (Klick/Tap/Drag/Drop)?
- Hat das Spiel Erfolgs-/Fehler-Feedback animiert (Score-Increment-Floater, Shake, Pop)?
- Werden Sounds bei Schlüssel-Ereignissen abgespielt (Spawn, Match, Game Over)?
- Gibt es einen „Idle"-Zustand, der nicht tot wirkt (Maskottchen-Blink, sanfte Hover/Pulse, Ambient-Detail)?
- Respektieren alle Animationen `prefers-reduced-motion`?

### Pattern
| Pattern | Severity | Hinweis |
|---|---|---|
| Spiel hat **keine** CSS-Animation/Transition (`@keyframes`, `transition:`, `animate-*`, `motion-*`) | 🔴 | Wirkt tot — mind. eine Feedback-Animation einbauen |
| Score/Punkte-Increment ohne visuelles Feedback (kein Pulse, Floater, Flip) | 🟡 | Nutzbar: `flip-digit`, `hyperfokus-floater` aus `index.css` |
| Game-Over/Win ohne erkennbare Animation (`shake`, `pop`, `confetti`) | 🟡 | Nutzbar: `star-pop`, `wordle-shake` |
| Hover/Active States ohne Übergang (`transition: none` oder fehlend) | 🔵 | Mindestens `transition-colors` an Buttons |
| Keine Sounds und kein Hinweis, dass das gewollt ist (Tool-Spiele wie Würfel/Timer ausgenommen) | 🟡 | Mind. ein Schlüssel-Event vertonen (`audio.ts` / `toneAudio.ts`) |
| Sounds vorhanden aber kein Mute-Respekt | siehe Kategorie 9 | — |
| Animation lange (>1.5 s) und nicht respektiert `prefers-reduced-motion` | 🔴 | a11y-Konflikt |
| Maskottchen / Charakter-Element ohne Lebenszeichen (kein Blink/Float/Wackeln) | 🔵 | Nutzbar: `MascotIcon` mit `blink`-Animation aus `index.css` |
| Drag-/Drop-Feedback ohne visuellen Hint (Snap-Animation, Ghost-Element) | 🟡 | |

### Wiederverwendbare Animationen (aus `src/index.css`)
- `star-pop` — Konfetti-/Belohnungs-Pop bei Achievement
- `card-pop-in` — Karten-/Tile-Einblendung
- `dice-tumble` — 3D-Würfel-Roll
- `flip-digit` — Zahlen-Flip (Timer, Score)
- `wordle-shake` — Fehler-Shake
- `blocks-line-sweep` — Reihen-Auflösung (Tetris/Blocks)
- `hyperfokus-floater` — Floating-Score-Particles
- `blink` — sanftes Blinzeln (Maskottchen)

### Wiederverwendbare Audio-Helfer
- `src/lib/audio.ts` — Web-Audio-Sine-Beeps (universell)
- `src/lib/toneAudio.ts` — Frequenz-spezifische Töne (Simon Says-Pattern)
- `src/lib/audioSettings.ts` — Mute-Toggle

### Spezialfälle / Ausnahmen
- **Werkzeuge** (Würfel, Clicker Timer): Sound optional, Animation aber wünschenswert (Würfel-Tumble pflicht).
- **Wort-Spiele** (Wordle, Wortgitter): Sound nice-to-have (Erfolg-Ding), Animation pflicht (Shake bei falscher Eingabe, Flip bei Reveal).
- **Reaktionstest**: Sound stark erwünscht (Trigger-Beep), Animation pflicht.
- **Logik-Spiele**: mindestens Click/Move-Feedback und Win-Animation.

### Vorgehen
1. Grep im Datei-Set + `src/index.css` Verweisen: `animate-`, `motion-`, `transition`, `@keyframes` Referenzen.
2. Grep nach Audio-Imports: `from "@/lib/audio"`, `from "@/lib/toneAudio"`, `playTone`, `playSound`.
3. Wenn Spiel weder Animation noch Sound auf Spieler-Aktion hat → 🔴.
4. Bei vorhandener Animation prüfen: respektiert `prefers-reduced-motion`?
5. **Befund-Vorschlag** im Report konkret: „Empfohlene Animation: `star-pop` auf Level-Up in Zeile XY" — keinen automatischen Quick-Win (zu inhaltlich), aber konkreten Codeschnipsel im Report bereitstellen.

---

## 12. Pause / Save / Resume / Tab-Wechsel

### Was prüfen
- Pausiert das Spiel sauber bei `visibilitychange` → `hidden`?
- Stoppt es `requestAnimationFrame` / `setInterval` / Audio im Pause-State?
- Wird laufender Spielstand persistiert (sodass Reload nicht alles verliert)?
- Sauberer Resume nach Tab-Rückkehr?

### Pattern
| Pattern | Severity | Hinweis |
|---|---|---|
| Spiel hat Timer/RAF/Animation, aber keinen `visibilitychange`-Handler | 🔴 | Tab-Wechsel führt zu Performance-Drift oder unfairer Zeit |
| `setInterval`/RAF läuft im `useEffect` ohne Cleanup-Return | 🔴 | Memory-Leak |
| Spiel ist Session-zeitkritisch (z.B. Reaktionstest, Speedrun-Style), aber Score wird bei Reload nicht gehalten | 🔵 | Nice-to-have |
| Spiel ist Save-fähig (Sudoku, Sokoban, Hyperfokus, FreeCell), aber kein Auto-Save | 🟡 | Frust bei Reload |
| Pause-State sichtbar (Overlay/Modal), aber Eingaben gehen durch | 🟡 | Pause muss Inputs blocken |
| WakeLock akquiriert aber nicht in Cleanup released | 🟡 | Battery-Drain |
| Audio läuft weiter wenn Tab versteckt | 🟡 | |

### Spiele die Auto-Save brauchen
Sudoku, Sokoban (Kistenschieber), FreeCell, Hyperfokus, Stau, Gfrett, Nonogram, Tangram, Lichter aus, Hanoi, Verbinden — alle „Lösung-in-Etappen"-Spiele.

### Spiele die das **nicht** brauchen
Snake, 2048 (kurze Sessions), Reaktionstest, Stroop, Schulte (zeitbasiert, Replay-Start sinnvoll), Würfel/Timer (Werkzeuge).

### Vorgehen
1. Grep nach `visibilitychange`, `document.hidden`, `requestAnimationFrame`, `setInterval`.
2. Wenn Game-Loop existiert ohne Pause-Hook → 🔴.
3. Bei Auto-Save-Kandidaten: gibt es einen LocalStorage-Key für „aktueller Spielstand" (nicht nur Highscore)?

---

## 13. Schwierigkeit, Onboarding & Replay-Value

### Was prüfen
- Difficulty-Stufen vorhanden (wo sinnvoll)?
- Erste Runde fair (nicht zu schwer am Anfang)?
- Erkennt man das Spielprinzip in den ersten 5 Sekunden?
- Wiederspielbarkeit: Highscore, Daily Challenge, Streak, Random Seeds?

### Pattern
| Pattern | Severity | Hinweis |
|---|---|---|
| Komplexes Spiel ohne Difficulty-Picker (Memory, Sudoku, Minensucher, Schulte, Mastermind, Hyperfokus) | 🟡 | Einsteiger-Frust |
| Erste Runde nicht reproduzierbar zugänglich (z.B. Snake startet bei Geschwindigkeit 10) | 🔵 | Onboarding-Hinweis |
| Kein Highscore-Tracking obwohl möglich | 🟡 | Replay-Anker fehlt |
| Daily Challenge / Random-Seed-Modus möglich aber nicht implementiert (Status.md Phase 2.6) | 🔵 | Roadmap-Punkt |
| Streak/Serie-Tracking fehlt bei Eignung (Wordle, Reaktionstest, Stroop) | 🔵 | |
| Keine Stats über Sessions (Spiele gespielt, Bestzeit, Gesamtzeit) | 🔵 | Phase 2.1 Stats-Dashboard |
| First-Visit-Tutorial / Hint nicht vorhanden bei komplexem Spiel | 🟡 | siehe Kategorie 5 |
| Spiel hat End-State („Du hast gewonnen"), aber kein „Nochmal!"-Button | 🟡 | Replay-Reibung |

### Vorgehen
1. Grep im Spiel nach `difficulty`, `level`, `easy`, `medium`, `hard`.
2. Grep im Catalog/Component nach `seed`, `daily`, `streak`.
3. Prüfe ob es einen LocalStorage-Key mit `BEST`/`HIGHSCORE`/`STATS` gibt.
4. Lies erste 30 Zeilen der Game-Component und Beschreibung — würde ein neuer Spieler das Spiel verstehen?

---

## 14. Empty / Error / Recovery States

### Was prüfen
- Wie sieht die UI beim allerersten Start aus (keine Highscores, kein Save, keine Stats)?
- Was passiert bei corrupt LocalStorage (Zod-Validation-Fail)?
- Sinnvolle Fehler-States bei unerwarteten Inputs?

### Pattern
| Pattern | Severity | Hinweis |
|---|---|---|
| `localStorage` wird gelesen aber kein Default/Fallback bei `null` | 🔴 | Crash beim Erst-Start |
| Zod-Parse ohne `.catch`/`.safeParse` und ohne Reset bei Fail | 🔴 | Crash bei corrupt Daten |
| Highscore-Anzeige zeigt `undefined` / `NaN` / leeres String beim Erst-Start | 🟡 | UX |
| Stats/History-Liste leer, kein Empty-State-Hinweis („Spiele jetzt deine erste Runde!") | 🔵 | |
| `JSON.parse(localStorage....)` ohne try/catch | 🔴 | |
| Game-Component crash → keine `ErrorBoundary` darüber | 🟡 | |
| Notation-Parser/Eingabe-Parser ohne Validation (z.B. DiceRoller `2d6+x`) | 🟡 | |
| Edge-Case: 0-Items, Min/Max-Inputs nicht abgefangen | 🔵 | |

### Vorgehen
1. Grep nach `JSON.parse(`, `localStorage.getItem(`, `.parse(` → safe?
2. Lies Highscore/Stats-Rendering: was wird gezeigt wenn der Wert `undefined`?
3. Prüfe Zod-Schema-Verwendung in `persistedSchemas.ts` für das Spiel — wird `safeParse` + Reset verwendet?

---

## 15. Game Feel / Juice & Share-Funktion

### Was prüfen
- Hat das Spiel über die Basis-Animation hinaus „Saft" (Screen-Shake, Hit-Pause, Anticipation, Combo-Eskalation)?
- Sind Erfolge feiernd (Konfetti, Floater, Animation auf finalem Score)?
- Gibt es eine Share-Funktion für Ergebnisse (Emoji-Grid wie Wordle, Web-Share-API)?

### Pattern
| Pattern | Severity | Hinweis |
|---|---|---|
| Win/Game-Over wird nur durch Text gezeigt (kein Effekt, keine Animation) | 🟡 | Belohnungs-Moment fehlt — `star-pop`, `hyperfokus-floater`, `wordle-shake` |
| Eingaben (Tap/Click) ohne unmittelbares Feedback (kein Press-Effekt, kein Sound, keine Animation) | 🟡 | Bedienung wirkt träge |
| Streak/Combo-State ohne Visual-Eskalation | 🔵 | Spielerische Spannung |
| Achievements/Milestones ohne Feier-Moment | 🔵 | |
| Score-Sharing fehlt obwohl es passt (Wordle, Reaktionstest, Schulte, Stroop, Memory) | 🔵 | `navigator.share()` + Emoji-Grid |
| Hover/Press-States sind statisch (kein Scale/Translate auf Press) | 🔵 | UX-Polish |
| Lange Zustands-Übergänge (>500 ms) ohne Skip-Möglichkeit | 🔵 | |
| Score-Erhöhung springt instantan (kein Count-Up von alt → neu) | 🔵 | |

### Vorgehen
1. Schaue Win-/Game-Over-Branch: wird ein animiertes Element gezeigt?
2. Grep nach `navigator.share`, `clipboard.writeText`, „Teilen", „Share".
3. Spiele Game Feel ist subjektiv — Empfehlungen mit konkreten Code-Snippet-Vorschlägen, kein automatischer Fix.

### Empfehlungs-Snippets (für Report)

**Web-Share-Emoji-Grid** (Wordle-Style):
```ts
const grid = guesses.map(g => g.map(c => c === "correct" ? "🟩" : c === "present" ? "🟨" : "⬛").join("")).join("\n");
navigator.share?.({ title: "Wordle", text: `Wordle ${day} ${tries}/6\n\n${grid}` });
```

**Score Count-Up**:
```ts
useEffect(() => {
  let id: number; let cur = displayed;
  const step = () => { if (cur < score) { cur++; setDisplayed(cur); id = requestAnimationFrame(step); } };
  id = requestAnimationFrame(step);
  return () => cancelAnimationFrame(id);
}, [score]);
```

---

## Severity-Mapping für Heatmap-Tabelle (Sweep)

Pro Spiel × Kategorie: schlimmste Severity gewinnt.
- mind. ein 🔴 → 🔴
- sonst mind. ein 🟡 → 🟡
- sonst (nur 🔵 oder leer) → 🟢
