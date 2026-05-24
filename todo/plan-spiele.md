# Plan: Neue Spiele für die Spielwiese

## Runde 1 — ABGESCHLOSSEN (39 Spiele)

20 Spiele + Labyrinth, Tsuro, Mensch ärgere dich nicht erstellt und integriert.

---

## Runde 2 — 27 neue Spiele

Alle als self-contained HTML-Dateien, Dark-Theme, deutsche UI, Zurück-Link.
Am Ende: `spiele.html` aktualisieren (Gesamt: 66 Spiele).

---

### Batch 8 — Brettspiel-Klassiker (5 Spiele)
- [ ] `kniffel.html` — 5 Würfel, 3 Würfe pro Runde, Kombinationen (Dreierpasch, Full House, Kniffel etc.), Punktetabelle, Solo oder vs KI
- [ ] `halma.html` — Sternhalma auf 6-zackigem Brett, Figuren hüpfen, KI-Gegner
- [ ] `risiko.html` — Vereinfachtes Risiko: Weltkarte, Gebiete erobern, Würfelkämpfe, Truppenverstärkung, 2-4 Spieler (1 Mensch + KI)
- [ ] `kaesekästchen.html` — Dots and Boxes, Linien setzen, Kästchen schließen, vs KI
- [ ] `mancala.html` — Kalaha/Mancala, Steine verteilen, Mulden leeren, vs KI

### Batch 9 — Kartenspiele (4 Spiele)
- [ ] `schwimmen.html` — 3 Karten, tauschen gegen Mitte, nah an 31, Mehrere Runden, 3 Leben
- [ ] `mau-mau.html` — Karten ablegen, Sonderkarten (7=ziehen, 8=aussetzen, Bube=wünschen), vs 1-3 KI
- [ ] `poker.html` — Texas Hold'em, Chips, Blinds, Raise/Call/Fold, vs 3 KI
- [ ] `skip-bo.html` — Kartenstapel abbauen, Hilfsstapel, Ablagestapel 1-12, vs KI

### Batch 10 — Puzzle / Logik (5 Spiele)
- [ ] `mastermind.html` — Farbcode erraten, 4-6 Farben, 8-12 Versuche, Schwarz/Weiß-Hinweise
- [ ] `tower-of-hanoi.html` — 3-8 Scheiben, 3 Stäbe, Zugzähler, Bestzeit
- [ ] `tangram.html` — 7 Teile, Formen nachbauen, Drag & Rotate, 10+ Vorlagen
- [ ] `pipe-puzzle.html` — Rohre drehen bis Wasser fließt, verschiedene Gittergrößen
- [ ] `slitherlink.html` — Zahlenrätsel, geschlossene Schleife um Zahlen ziehen, verschiedene Größen

### Batch 11 — Arcade / Geschicklichkeit (5 Spiele)
- [ ] `asteroids.html` — Raumschiff, Asteroiden zerstören, Wrap-Around, Highscore
- [ ] `doodle-jump.html` — Endlos nach oben hüpfen, Plattformen, Feinde, Tilt/Tastatur
- [ ] `frogger.html` — Frosch über Straße (Autos) und Fluss (Baumstämme), Level-System
- [ ] `pinball.html` — Flipper mit Canvas-Physik, Bumper, Rampen, Punktesystem
- [ ] `helicopter.html` — Endlos-Scroller, Decke/Boden ausweichen, Hindernisse, Highscore

### Batch 12 — Wort / Wissen (4 Spiele)
- [ ] `kreuzwortraetsel.html` — Klassisches Kreuzworträtsel, deutsche Wörter, 3 Schwierigkeiten
- [ ] `wortsuche.html` — Buchstabensalat, Wörter im Gitter finden und markieren
- [ ] `scrabble.html` — Solo-Scrabble, Buchstaben legen, Punkte maximieren, Wörterbuch-Check
- [ ] `vier-bilder.html` — 4 Emoji-Hinweise, 1 Wort erraten, Buchstaben vorgegeben

### Batch 13 — Strategie (4 Spiele)
- [ ] `hex.html` — Verbindungsspiel auf Rauten-Brett, 2 Spieler, KI-Gegner
- [ ] `stratego.html` — Verdeckte Figuren, Ränge, Angriff/Verteidigung, vs KI
- [ ] `game-of-life.html` — Conway's Game of Life, Muster zeichnen, Start/Stop/Speed, Vorlagen
- [ ] `nim.html` — Streichholz-Spiel, Reihen wegnehmen, wer das letzte nimmt verliert, vs KI

### Batch 14 — Integration
- [ ] `spiele.html` aktualisieren — alle 27 neuen Spiele eintragen (Gesamt: 66)

---

## Design-Vorgaben (wie Runde 1)

- Dark-Theme: `#1a1a2e` / `#16213e` / `#0f3460` / `#c9b458`
- Self-contained HTML (kein CDN)
- Canvas für Arcade, DOM für Brett/Karten/Puzzle
- Zurück-Link zu `spiele.html`
- Deutsche UI-Texte
- Responsive, Touch-Unterstützung
- Highscores in localStorage

## Status Runde 2

**ABGESCHLOSSEN** — Alle 27 Spiele erstellt und in spiele.html integriert (Gesamt: 66 Spiele).

---

## Runde 3 — 30 neue Spiele

Alle als self-contained HTML-Dateien, Dark-Theme, deutsche UI, Zurück-Link.
Am Ende: `spiele.html` aktualisieren (Gesamt: 96 Spiele).

---

### Batch 15 — Brettspiele (5 Spiele)
- [ ] `domino.html` — Klassisches Domino, Steine anlegen (Doppelsteine), Passen wenn nichts passt, vs 1-2 KI, Punkte = übrige Augen der Gegner
- [ ] `leiterspiel.html` — 10x10 Brett, Würfeln, Leitern (aufwärts) + Schlangen (abwärts), 2-4 Spieler (1 Mensch + KI), animierte Bewegung
- [ ] `qwirkle.html` — 6 Farben × 6 Formen, Reihen legen (gleiche Farbe oder Form), Punkte pro Reihe, Qwirkle-Bonus (6er-Reihe), vs KI
- [ ] `rush-hour.html` — Autos auf 6x6 Gitter schieben, rotes Auto zum Ausgang, 30+ vordefinierte Level, Zugzähler, Schwierigkeitsstufen
- [ ] `pentomino.html` — 12 Pentomino-Teile in ein 6x10 Rechteck legen, Drag & Rotate, mehrere Lösungen möglich, Hinweis-System

### Batch 16 — Deutsche Kartenspiele (4 Spiele)
- [ ] `skat.html` — 32 Karten, 3 Spieler (1 Mensch + 2 KI), Reizen (18-Punkte-System), Handspiel, Grand, Null, Farbspiel, Stiche sammeln, Punkte >= Reizwert
- [ ] `doppelkopf.html` — 48 Karten (doppelt), 4 Spieler (1 Mensch + 3 KI), Trumpf-Hierarchie (Herz 10, Kreuz Dame etc.), Re/Kontra, stille Hochzeit
- [ ] `romme.html` — 2×52 + Joker, 13 Karten pro Spieler, Sätze (3-4 gleiche) und Reihen (Sequenzen), Erstauslage 40 Punkte, Anlegen, Joker tauschen, vs 1-2 KI
- [ ] `canasta.html` — 2×52 + 4 Joker, Meldungen (3+ gleiche), Wildcards (2er + Joker), Canasta (7er-Meldung), rote/schwarze Dreier, vs KI-Team

### Batch 17 — Puzzle / Logik (5 Spiele)
- [ ] `futoshiki.html` — Zahlenrätsel wie Sudoku, aber mit >/< Zeichen zwischen Zellen, Gittergrößen 4x4 bis 7x7, Puzzle-Generator
- [ ] `binairo.html` — Gitter mit 0en und 1en füllen, max 2 gleiche nebeneinander, gleich viele 0/1 pro Reihe, keine identischen Reihen, 6x6 bis 12x12
- [ ] `hitori.html` — Zahlengitter, Zellen schwärzen: keine doppelten Zahlen in Reihe/Spalte, schwarze Zellen nicht benachbart, weiße zusammenhängend, 5x5 bis 9x9
- [ ] `color-flood.html` — 14x14 Brett mit 6 Farben, Farbe wählen = angrenzende Felder übernehmen, Ziel: ganzes Brett in möglichst wenig Zügen einfärben
- [ ] `nurikabe.html` — Inseln und Meer: Zahlen = Inselgröße, Meer zusammenhängend, keine 2x2-Meer-Blöcke, Inseln getrennt, 5x5 bis 10x10

### Batch 18 — Arcade / Casual (5 Spiele)
- [ ] `bubble-shooter.html` — Farbige Blasen oben, Blase abschießen, 3+ gleiche Farben = platzen, hängende Blasen fallen, Level-System, Highscore
- [ ] `match3.html` — 8x8 Gitter mit Edelsteinen, tauschen für 3er-Reihen, Kaskaden, Spezialsteine (4er = Bombe, 5er = Regenbogen), Punkte + Timer-Modus
- [ ] `columns.html` — Tetris-Variante: 3er-Säulen mit Farben fallen, 3+ gleiche horizontal/vertikal/diagonal = weg, Kaskaden, steigende Geschwindigkeit
- [ ] `lemmings.html` — 2D-Plattform, Lemminge laufen automatisch, Fähigkeiten zuweisen (Graber, Blocker, Brückenbauer, Fallschirm), 10+ Level, Rettungsquote
- [ ] `idle-clicker.html` — Cookie-Clicker-Stil: Klicken für Punkte, Upgrades kaufen (Auto-Klicker, Multiplikatoren), Prestige-System, Fortschritt in localStorage

### Batch 19 — Casino / Glück (4 Spiele)
- [ ] `roulette.html` — Europäisches Roulette (0-36), Einsätze: Zahl, Rot/Schwarz, Gerade/Ungerade, Dutzend, Reihe, Splits, Chips-System, Drehanimation
- [ ] `bingo.html` — 5x5 Karte (B-I-N-G-O), Zahlen 1-75 werden gezogen, Markieren, Gewinnmuster (Reihe, Spalte, Diagonale, Full House), mehrere Karten gleichzeitig
- [ ] `slot-machine.html` — 3 Walzen, Symbole (Kirsche, Zitrone, 7, Bar, Diamant), Gewinnlinien, Einsatz wählen, Auto-Spin, Freispiele bei 3× Scatter, Chip-System
- [ ] `wuerfelpoker.html` — 5 Würfel, Pokerkombinationen (Paar bis Fünfling), 3 Würfe pro Runde, Würfel halten, vs KI, Turnier-Modus

### Batch 20 — Wort / Wissen (4 Spiele)
- [ ] `connections.html` — 16 deutsche Wörter in 4 Gruppen à 4 sortieren, Farbkodierung (gelb=leicht bis lila=schwer), 4 Fehlversuche, 20+ Rätsel
- [ ] `buchstabierbiene.html` — 7 Buchstaben (1 Pflichtbuchstabe in der Mitte), alle Wörter mit 4+ Buchstaben finden, Pangram-Bonus, eingebautes Wörterbuch, Punkte
- [ ] `anagramm.html` — Buchstaben eines Worts durcheinander, richtiges Wort erraten, Timer, Schwierigkeitsstufen (4-10 Buchstaben), Hinweis-System, 100+ Wörter
- [ ] `wer-wird-millionaer.html` — 15 Fragen, steigende Schwierigkeit + Gewinn (50 → 1.000.000), 3 Joker (50:50, Publikum, Telefon), Sicherheitsstufen, 50+ Fragensets

### Batch 21 — Strategie / Simulation (3 Spiele)
- [ ] `tower-defense.html` — Canvas, Pfad-basiert, Wellen von Gegnern, Türme platzieren (Kanone, Laser, Frost, Rakete), Upgrades, 10+ Wellen, Geld-System
- [ ] `minesweeper-hex.html` — Minesweeper auf Sechseck-Gitter, 6 Nachbarn statt 8, 3 Schwierigkeiten, Timer, Highscore
- [ ] `conway-battle.html` — 2-Spieler Game of Life: Jeder platziert Zellen in eigener Farbe, dann Simulation, wer mehr Zellen nach N Generationen hat gewinnt

### Batch 22 — Integration
- [ ] `spiele.html` aktualisieren — alle 30 neuen Spiele eintragen (Gesamt: 96)

---

## Design-Vorgaben (wie Runde 1 + 2)

- Dark-Theme: `#1a1a2e` / `#16213e` / `#0f3460` / `#c9b458`
- Self-contained HTML (kein CDN)
- Canvas für Arcade, DOM für Brett/Karten/Puzzle
- Zurück-Link zu `spiele.html`
- Deutsche UI-Texte
- Responsive, Touch-Unterstützung
- Highscores in localStorage

## Status Runde 3

**ABGESCHLOSSEN** — Alle 30 Spiele erstellt und in spiele.html integriert (Gesamt: 96 Spiele).
