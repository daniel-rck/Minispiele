---
name: game-audit
description: Auditiert ein Minispiel (oder alle mit `--all`) systematisch auf einheitlichen Style, Wiederverwendung, Touch, Steuerung, Anleitung, a11y, Architektur, Tests/Bundle, Audio/Haptik. Aufruf mit dem Spiel-Slug/Titel als Argument oder `--all` für Sweep.
---

# game-audit

Systematische Qualitätsprüfung eines Minispiels (oder aller Spiele) gegen die 15 Kategorien aus `CHECKLIST.md`. Wendet sichere Quick-Wins automatisch an und übergibt riskante Befunde dem Entwickler.

## Aufruf

- `game-audit <Spielname-oder-Slug>` — einzelnes Spiel auditieren.
- `game-audit --all` oder `game-audit all` — Sweep über alle Spiele aus `src/lib/gamesCatalog.ts`.
- `game-audit` (ohne Argument) — Liste verfügbarer Spiele + Hinweis auf `--all` ausgeben, dann beenden.

## Ablauf — Standardmodus (ein Spiel)

1. **Argument lesen**. Wenn `--all` oder `all` → springe zu Sweep-Modus.
2. **Spiel resolven** gegen `src/lib/gamesCatalog.ts`:
   - case-insensitive Match auf `slug`, `title`, oder Alias-Variante.
   - Bei mehreren Treffern: alle anzeigen, abbrechen.
   - Bei 0 Treffern: 3 nächste Fuzzy-Matches anzeigen, abbrechen.
3. **Datei-Set zusammenstellen**:
   - Page: `src/pages/<Title>.tsx` (oder gemäß Route)
   - Component(s): `src/components/<Title>Game.tsx` und alle `src/components/<Title>*.tsx`
   - Library: `src/lib/<slug>.ts` falls vorhanden
   - Tests: `src/lib/<slug>.test.ts`, `src/components/<Title>Game.test.tsx`, `e2e/*<slug>*.spec.ts`
   - Preview: `public/games/<slug>-preview.svg`
4. **Statische Analyse** der 15 Kategorien aus `CHECKLIST.md`. Pro Kategorie:
   - grep/Read-Pattern aus Checklist anwenden
   - Befunde mit Severity (🔴/🟡/🔵) und Datei:Zeile sammeln
5. **Lint-Lauf**: `bunx biome lint <files>` (oder `bun run check <files>` für Lint + Format zusammen). Lint-Fehler in passende Kategorien einsortieren.
6. **TypeScript-Check**: `bun run typecheck` (am Projekt — TypeScript hat keinen Single-File-Modus). Output nach relevanten Dateien filtern.
7. **Quick-Wins anwenden** gemäß `QUICK_WINS.md`. Vor jeder Schreib-Aktion einen kleinen Notiz-Eintrag im Report sammeln. Nach allen Quick-Wins einmal `bunx biome format --write <files>` (oder `bunx biome check --write <files>` für Format + safe Lint-Fixes).
8. **Report rendern** gemäß `REPORT_TEMPLATE.md`. Im Chat ausgeben.
9. **Nicht commiten**. Hinweisen, dass User die Änderungen reviewen + commiten muss.

## Ablauf — Sweep-Modus (`--all` / `all`)

1. Spiele-Liste aus `src/lib/gamesCatalog.ts` extrahieren (alle `slug`-Einträge).
2. **Einmaliger Projekt-Check**:
   - `bun run check` projektweit (Biome Lint + Format-Check in einem)
   - `bun run typecheck` projektweit
   - Ergebnisse cachen, später je Spiel zuordnen anhand Datei-Pfade.
3. **Pro Spiel seriell**:
   - Datei-Set sammeln (wie Standardmodus Schritt 3)
   - Statische Analyse der 15 Kategorien (Schritt 4)
   - Lint/Typecheck-Befunde aus dem Cache zuordnen (statt erneut auszuführen)
   - Quick-Wins anwenden
   - Befunde aggregieren
4. **Heatmap-Tabelle** rendern: Zeilen = Spiele, Spalten = die 15 Kategorien + Quick-Wins-Counter. Zelle = schlimmste Severity (🔴/🟡/🟢) der Kategorie für das Spiel.
5. **Pro-Spiel-Details** als kollabierte `<details><summary>`-Blöcke direkt unter der Tabelle (verwendet `REPORT_TEMPLATE.md` in Kurzform).
6. **Gesamt-Zusammenfassung**:
   - Top-5 Spiele mit höchstem Handlungsbedarf
   - 3-5 häufigste Befund-Pattern projektweit
   - Anzahl angewandter Quick-Wins gesamt + nach Typ
7. **Nicht commiten**.

## Wichtige Verhaltensregeln

- **Niemals automatisch commiten oder pushen**. Quick-Wins werden im Working-Tree geschrieben, User entscheidet danach.
- **Idempotenz**: Quick-Wins müssen sicher sein — zweite Ausführung darf nicht doppelt patchen. Vor jedem Quick-Win prüfen, ob die Bedingung noch zutrifft.
- **Konservativ bei Style-Mappings**: Hardcoded Farben nur ersetzen, wenn das Token-Mapping eindeutig ist (siehe `QUICK_WINS.md` für Mapping-Tabelle). Bei Unsicherheit → nur als Befund im Report, kein Fix.
- **Sprache**: alle User-facing-Strings die der Skill einfügt (description-Aufwertungen, aria-labels) auf **Deutsch** in du-Form, konsistent zum Projekt-Stil.
- **Keine neuen Patterns einführen**. Nutze nur Komponenten und Konventionen aus `src/components/ui/` und `src/lib/`.
- **Kein voller `bun run build`**, **kein Vitest-Run**. Beides ist zu langsam für die Audit-Iteration.

## Wenn etwas schiefgeht

- `bun`-Binary fehlt → fallback auf `npx`/`bunx` oder Hinweis ausgeben + abbrechen.
- `bun run check` schlägt syntaktisch fehl (z.B. Biome-Config-Problem) → Audit fortsetzen ohne Lint-Output, Hinweis im Report.
- TypeScript-Check timeout (>60s) → mit Timeout abbrechen, Hinweis im Report („typecheck übersprungen — manuell prüfen").
- Spiel hat keine `src/lib/<slug>.ts` → Kategorie „Architektur" flaggt das als 🟡, ist aber kein Skill-Abbruch.

## Referenz-Dateien (im Projekt)

- `src/lib/gamesCatalog.ts` — Source of Truth für Spiele-Liste
- `src/lib/constants.ts` — `STORAGE_KEYS`
- `src/index.css` — Design-Tokens
- `src/components/ui/` — wiederverwendbare UI-Komponenten
- `src/components/GameLayout.tsx` — Wrapper mit `description`-Prop
- `src/components/AriaLive.tsx` — Announcement-Pattern
- `CONTRIBUTING.md` — Coding Standards (44px Touch, 270 KB Bundle, 320px Mobile)
