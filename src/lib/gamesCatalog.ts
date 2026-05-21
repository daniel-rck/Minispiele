import { ROUTES } from './routes.ts';

export type Category = 'logik' | 'wort' | 'action' | 'gehirntraining' | 'karten' | 'werkzeuge';

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export interface GameCard {
  /** Route path, e.g. "/ring-sort". Must match a value from `ROUTES`. */
  to: RoutePath;
  /** Stable slug used for stats/favorites/recent. Derived from `to` without leading slash. */
  slug: string;
  title: string;
  description: string;
  preview: string;
  previewAlt: string;
  category: Category;
}

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'logik', label: 'Logik & Denksport' },
  { id: 'wort', label: 'Wort & Sprache' },
  { id: 'action', label: 'Action & Arcade' },
  { id: 'gehirntraining', label: 'Gehirntraining' },
  { id: 'karten', label: 'Karten' },
  { id: 'werkzeuge', label: 'Werkzeuge' },
];

interface GameCardInput {
  to: RoutePath;
  title: string;
  description: string;
  preview: string;
  previewAlt: string;
  category: Category;
}

function asGame(input: GameCardInput): GameCard {
  return { ...input, slug: input.to.replace(/^\//, '') };
}

const GAME_INPUTS: GameCardInput[] = [
  {
    to: '/ring-sort',
    title: 'Ringe sortieren',
    description: 'Sortiere bunte Ringe in drei Farben auf vier Stäben.',
    preview: '/games/ring-sort-preview.svg',
    previewAlt: 'Vorschau: vier Stäbe mit gestapelten roten, blauen und grünen Ringen',
    category: 'logik',
  },
  {
    to: '/timer',
    title: 'Clicker Timer',
    description: 'Countdown einstellen. Jeder Tipp startet ihn neu und beendet den Alarm.',
    preview: '/games/timer-preview.svg',
    previewAlt: 'Vorschau: ein Stoppuhr-Zifferblatt mit Countdown',
    category: 'werkzeuge',
  },
  {
    to: '/dice',
    title: 'Würfel',
    description:
      'Würfelset zum Pen-and-Paper-Spielen: Kniffel, Mäxle & mehr — frei konfigurierbar.',
    preview: '/games/dice-preview.svg',
    previewAlt: 'Vorschau: drei farbige Würfel mit Augen',
    category: 'werkzeuge',
  },
  {
    to: '/memory',
    title: 'Memory',
    description: 'Finde alle Paare mit möglichst wenigen Zügen. Drei Schwierigkeitsstufen.',
    preview: '/games/memory-preview.svg',
    previewAlt: 'Vorschau: ein Raster mit teilweise aufgedeckten Karten',
    category: 'gehirntraining',
  },
  {
    to: '/twenty-forty-eight',
    title: '2048',
    description: 'Wische Kacheln zusammen, bis die 2048 erscheint. Pfeiltasten oder Touch.',
    preview: '/games/twenty-forty-eight-preview.svg',
    previewAlt: 'Vorschau: ein 4×4-Raster mit Zahlenkacheln',
    category: 'logik',
  },
  {
    to: '/sliding-puzzle',
    title: 'Schiebepuzzle',
    description: 'Klassisches 15er-Puzzle — schiebe Plättchen in die richtige Reihenfolge.',
    preview: '/games/sliding-puzzle-preview.svg',
    previewAlt: 'Vorschau: ein 4×4-Raster mit nummerierten Plättchen und einer Lücke',
    category: 'logik',
  },
  {
    to: '/simon',
    title: 'Simon Says',
    description: 'Merke dir wachsende Farb- und Tonfolgen und wiederhole sie korrekt.',
    preview: '/games/simon-preview.svg',
    previewAlt:
      'Vorschau: vier farbige Viertelkreise (grün, rot, gelb, blau) um eine zentrale Scheibe',
    category: 'gehirntraining',
  },
  {
    to: '/minesweeper',
    title: 'Minensucher',
    description: 'Decke Felder auf, ohne eine Mine zu treffen. Drei Schwierigkeitsstufen.',
    preview: '/games/minesweeper-preview.svg',
    previewAlt: 'Vorschau: ein Raster mit aufgedeckten Zahlen, Flaggen und einer sichtbaren Mine',
    category: 'logik',
  },
  {
    to: '/snake',
    title: 'Snake',
    description: 'Sammle Futter, wachse und kollidiere nicht. Wisch- oder Pfeiltasten-Steuerung.',
    preview: '/games/snake-preview.svg',
    previewAlt: 'Vorschau: eine grüne Schlange auf dunklem Raster mit rotem Apfel',
    category: 'action',
  },
  {
    to: '/wordle',
    title: 'Wordle',
    description: 'Errate das 5-Buchstaben-Wort in sechs Versuchen — mit Farbfeedback.',
    preview: '/games/wordle-preview.svg',
    previewAlt: 'Vorschau: ein Raster mit teils grün, gelb und grau eingefärbten Buchstabenfeldern',
    category: 'wort',
  },
  {
    to: '/sudoku',
    title: 'Sudoku',
    description: 'Fülle das 9×9-Gitter so, dass jede Zahl pro Zeile, Spalte und Block vorkommt.',
    preview: '/games/sudoku-preview.svg',
    previewAlt: 'Vorschau: ein 9×9-Sudoku-Gitter mit teils gefüllten Zellen',
    category: 'logik',
  },
  {
    to: '/nonogram',
    title: 'Bildrätsel',
    description: 'Picross: füll die Zellen anhand der Zahlenhinweise, bis ein Bild entsteht.',
    preview: '/games/nonogram-preview.svg',
    previewAlt: 'Vorschau: ein Nonogramm mit gefüllten Zellen und Zahlen am Rand',
    category: 'logik',
  },
  {
    to: '/lights-out',
    title: 'Lichter aus',
    description: 'Ein Tipp schaltet ein Feld und seine Nachbarn um. Schalte alle Lichter aus.',
    preview: '/games/lights-out-preview.svg',
    previewAlt: 'Vorschau: 5×5-Gitter mit teils leuchtenden Feldern',
    category: 'logik',
  },
  {
    to: '/mastermind',
    title: 'Codeknacker',
    description: 'Errate die 4-Farben-Kombination des Computers in zehn Versuchen.',
    preview: '/games/mastermind-preview.svg',
    previewAlt: 'Vorschau: Reihen farbiger Steine mit kleinen Bewertungsmarkern',
    category: 'logik',
  },
  {
    to: '/hanoi',
    title: 'Türme von Hanoi',
    description: 'Bewege alle Scheiben vom linken zum rechten Stab. Möglichst wenige Züge.',
    preview: '/games/hanoi-preview.svg',
    previewAlt: 'Vorschau: drei Stäbe mit gestapelten farbigen Scheiben',
    category: 'logik',
  },
  {
    to: '/sokoban',
    title: 'Kistenschieber',
    description: 'Schiebe Kisten auf die markierten Zielfelder im Lagerhaus-Puzzle.',
    preview: '/games/sokoban-preview.svg',
    previewAlt: 'Vorschau: Lagerhaus-Gitter mit Spielfigur, Kisten und Zielen',
    category: 'logik',
  },
  {
    to: '/flow',
    title: 'Verbinden',
    description: 'Zeichne Linien zwischen gleichfarbigen Punkten ohne sich zu kreuzen.',
    preview: '/games/flow-preview.svg',
    previewAlt: 'Vorschau: ein Gitter mit farbigen Endpunkten und verbindenden Linien',
    category: 'logik',
  },
  {
    to: '/tangram',
    title: 'Tangram',
    description: 'Setze sieben geometrische Teile zu vorgegebenen Silhouetten zusammen.',
    preview: '/games/tangram-preview.svg',
    previewAlt: 'Vorschau: sieben geometrische Tangram-Teile in Quadratform',
    category: 'logik',
  },
  {
    to: '/freecell',
    title: 'FreeCell',
    description: 'Klassische Solitär-Variante: sortiere alle Karten auf die vier Foundations.',
    preview: '/games/freecell-preview.svg',
    previewAlt: 'Vorschau: vier freie Zellen, vier Foundations und Tableau-Stapel mit Karten',
    category: 'karten',
  },
  {
    to: '/hangman',
    title: 'Galgenmännchen',
    description: 'Errate das Wort Buchstabe für Buchstabe — bevor der Galgen fertig ist.',
    preview: '/games/hangman-preview.svg',
    previewAlt: 'Vorschau: ein Galgen-Strichgerüst und Unterstriche für Buchstaben',
    category: 'wort',
  },
  {
    to: '/wordsearch',
    title: 'Wortgitter',
    description: 'Finde versteckte deutsche Wörter im Buchstaben-Gitter — horizontal und vertikal.',
    preview: '/games/wordsearch-preview.svg',
    previewAlt: 'Vorschau: ein Gitter aus Buchstaben mit markierten Wörtern',
    category: 'wort',
  },
  {
    to: '/anagram',
    title: 'Wortsalat',
    description: 'Aus durcheinander gewürfelten Buchstaben das richtige Wort bilden.',
    preview: '/games/anagram-preview.svg',
    previewAlt: 'Vorschau: einzelne Buchstabenkacheln in zufälliger Reihenfolge',
    category: 'wort',
  },
  {
    to: '/breakout',
    title: 'Ziegelbruch',
    description: 'Halte den Ball im Spiel und räume alle Ziegel ab. Bewege das Paddel per Wisch.',
    preview: '/games/breakout-preview.svg',
    previewAlt: 'Vorschau: bunte Ziegelreihen, Ball und Paddel am unteren Bildrand',
    category: 'action',
  },
  {
    to: '/bubbles',
    title: 'Blasenschießen',
    description: 'Schieße farbige Blasen ab und bringe drei oder mehr gleichfarbige zum Platzen.',
    preview: '/games/bubbles-preview.svg',
    previewAlt: 'Vorschau: farbige Blasen im oberen Bereich, Schussvorrichtung unten',
    category: 'action',
  },
  {
    to: '/blocks',
    title: 'Blockstapler',
    description: 'Fallende Blöcke drehen und einreihen — vollständige Reihen verschwinden.',
    preview: '/games/blocks-preview.svg',
    previewAlt: 'Vorschau: ein hoher Schacht mit gestapelten farbigen Blöcken',
    category: 'action',
  },
  {
    to: '/reaction',
    title: 'Reaktionstest',
    description: 'Wie schnell bist du? Tippe sobald die Fläche grün wird — nicht früher.',
    preview: '/games/reaction-preview.svg',
    previewAlt: 'Vorschau: eine grüne Fläche mit dem Wort JETZT!',
    category: 'gehirntraining',
  },
  {
    to: '/schulte',
    title: 'Zahlentafel',
    description: 'Tippe die Zahlen 1 bis 25 der Schulte-Tabelle der Reihe nach an.',
    preview: '/games/schulte-preview.svg',
    previewAlt: 'Vorschau: ein 5×5-Gitter mit zufällig verteilten Zahlen',
    category: 'gehirntraining',
  },
  {
    to: '/stroop',
    title: 'Stroop-Test',
    description: 'Tippe auf die Schriftfarbe — nicht auf das Wort. 30 Sekunden lang.',
    preview: '/games/stroop-preview.svg',
    previewAlt: 'Vorschau: das Wort BLAU in roter Schrift, darunter vier Farbtasten',
    category: 'gehirntraining',
  },
  {
    to: '/traffic-jam',
    title: 'Stau',
    description:
      'Rush-Hour-Puzzle: schiebe blockierende Autos beiseite, bis das rote Auto rechts ausfahren kann.',
    preview: '/games/traffic-jam-preview.svg',
    previewAlt:
      'Vorschau: ein 6×6-Gitter mit bunten Autos, einem roten Zielauto und einem Ausfahrt-Pfeil rechts',
    category: 'logik',
  },
  {
    to: '/hyperfokus',
    title: 'Hyperfokus',
    description: 'Endloser Tap-Loop mit Crits, Combos, Auto-Tapper, Ereignissen und Prestige.',
    preview: '/games/hyperfokus-preview.svg',
    previewAlt: 'Vorschau: ein leuchtender Kern in einem Aurora-Gradient mit fliegenden Zahlen',
    category: 'gehirntraining',
  },
  {
    to: '/gfrett',
    title: 'Gfrett',
    description: 'Schiebe Farbblöcke vom Spielfeld und löse Dreier in der Match-Leiste auf.',
    preview: '/games/gfrett-preview.svg',
    previewAlt: 'Vorschau: bunte Blöcke auf einem Raster mit Match-Leiste am Rand',
    category: 'logik',
  },
  {
    to: '/color-flood',
    title: 'Farbflut',
    description:
      'Färbe das Feld von oben links aus ein. Schaffe alles in einer Farbe in höchstens 25 Zügen.',
    preview: '/games/color-flood-preview.svg',
    previewAlt: 'Vorschau: ein buntes 14×14-Raster mit sechs Farben',
    category: 'logik',
  },
  {
    to: '/spelling-bee',
    title: 'Buchstabierbiene',
    description:
      'Bilde deutsche Wörter aus sieben Buchstaben — der mittlere muss immer dabei sein.',
    preview: '/games/spelling-bee-preview.svg',
    previewAlt: 'Vorschau: sechs Sechsecke um einen gelben Mittelbuchstaben in Wabenform',
    category: 'wort',
  },
  {
    to: '/bingo',
    title: 'Bingo',
    description: 'Zwei Karten, 75 Zahlen. Wer zuerst eine Reihe schließt, ruft Bingo!',
    preview: '/games/bingo-preview.svg',
    previewAlt: 'Vorschau: eine 5×5-Bingokarte mit Spalten B, I, N, G, O und einer Freimitte',
    category: 'werkzeuge',
  },
  {
    to: '/slot-machine',
    title: 'Einarmiger Bandit',
    description: 'Klassische Drei-Walzen-Slot. Setze Token und jage den 50×-Diamanten-Jackpot.',
    preview: '/games/slot-machine-preview.svg',
    previewAlt: 'Vorschau: drei Walzen mit Glücksspielsymbolen wie Kirsche, Sieben und Diamant',
    category: 'werkzeuge',
  },
  {
    to: '/idle-clicker',
    title: 'Klick-Imperium',
    description:
      'Idle-Clicker mit sieben Upgrade-Stufen und Prestige-Multiplikator ab 10K Punkten.',
    preview: '/games/idle-clicker-preview.svg',
    previewAlt: 'Vorschau: ein goldener Klick-Button mit aufsteigenden Zahlen im Hintergrund',
    category: 'gehirntraining',
  },
  {
    to: '/leiterspiel',
    title: 'Leiterspiel',
    description:
      'Snakes & Ladders auf einem 10×10-Brett gegen drei KI-Gegner. Wer zuerst auf 100 ist, gewinnt.',
    preview: '/games/leiterspiel-preview.svg',
    previewAlt: 'Vorschau: ein 10×10-Brett mit grünen Leitern und roten Schlangen',
    category: 'logik',
  },
  {
    to: '/tic-tac-toe',
    title: 'Tic-Tac-Toe',
    description: 'Drei in einer Reihe gegen die KI mit Minimax-Suche und drei Stufen.',
    preview: '/games/tic-tac-toe-preview.svg',
    previewAlt: 'Vorschau: ein 3×3-Gitter mit X und O Symbolen',
    category: 'logik',
  },
  {
    to: '/asteroids',
    title: 'Asteroids',
    description: 'Drehe das Raumschiff, schub und schieße — Asteroiden in immer mehr Wellen.',
    preview: '/games/asteroids-preview.svg',
    previewAlt: 'Vorschau: ein dreieckiges Raumschiff zwischen unregelmäßigen Asteroiden',
    category: 'action',
  },
  {
    to: '/binairo',
    title: 'Binairo',
    description: 'Fülle das Gitter mit 0 und 1 — höchstens zwei Gleiche nebeneinander.',
    preview: '/games/binairo-preview.svg',
    previewAlt: 'Vorschau: ein 8×8-Gitter mit blauen 0en und roten 1en',
    category: 'logik',
  },
  {
    to: '/columns',
    title: 'Columns',
    description: 'Fallende Dreierstäbe — bilde Dreierreihen waagrecht, senkrecht oder diagonal.',
    preview: '/games/columns-preview.svg',
    previewAlt: 'Vorschau: ein schmales Spielfeld mit fallenden farbigen Steinkolumnen',
    category: 'action',
  },
  {
    to: '/connections',
    title: 'Connections',
    description: 'Sortiere 16 Wörter in vier zusammengehörige Vierergruppen.',
    preview: '/games/connections-preview.svg',
    previewAlt: 'Vorschau: ein 4×4-Gitter mit Wörtern in vier Farbgruppen',
    category: 'wort',
  },
  {
    to: '/conway-battle',
    title: 'Conway Battle',
    description: 'Platziere Zellen, simuliere Conways Game of Life — Blau gegen Rot.',
    preview: '/games/conway-battle-preview.svg',
    previewAlt: 'Vorschau: ein Pixelfeld mit blauen und roten Zellen im Konflikt',
    category: 'logik',
  },
  {
    to: '/doodle-jump',
    title: 'Doodle Jump',
    description: 'Hüpfe von Plattform zu Plattform — wie hoch schaffst du es?',
    preview: '/games/doodle-jump-preview.svg',
    previewAlt: 'Vorschau: eine gelbe Figur springt zwischen grünen Plattformen',
    category: 'action',
  },
  {
    to: '/flappy-bird',
    title: 'Flappy Bird',
    description: 'Flatter durch die Rohrenlücken — wie weit schaffst du es?',
    preview: '/games/flappy-bird-preview.svg',
    previewAlt: 'Vorschau: ein gelber Vogel zwischen blauen Rohrpaaren',
    category: 'action',
  },
  {
    to: '/frogger',
    title: 'Frogger',
    description: 'Bring den Frosch über Straße und Fluss in die Zielreihe.',
    preview: '/games/frogger-preview.svg',
    previewAlt: 'Vorschau: ein grüner Frosch zwischen Autos und Baumstämmen',
    category: 'action',
  },
  {
    to: '/futoshiki',
    title: 'Futoshiki',
    description: 'Latein-Quadrat mit Vergleichszeichen — fülle das Gitter mit 1 bis N.',
    preview: '/games/futoshiki-preview.svg',
    previewAlt: 'Vorschau: ein 5×5-Gitter mit Zahlen und Größer-/Kleiner-Zeichen',
    category: 'logik',
  },
  {
    to: '/game-of-life',
    title: 'Game of Life',
    description: 'Conways Zellularautomat — zeichne Muster und beobachte sie wachsen.',
    preview: '/games/game-of-life-preview.svg',
    previewAlt: 'Vorschau: ein Gitter mit gelben lebenden Zellen in Mustern',
    category: 'logik',
  },
  {
    to: '/halma',
    title: 'Halma',
    description: 'Bring deine zehn Steine in die gegnerische Ecke. Kettensprünge erlaubt.',
    preview: '/games/halma-preview.svg',
    previewAlt: 'Vorschau: ein 10×10-Brett mit blauen und roten Steinen in den Ecken',
    category: 'logik',
  },
  {
    to: '/helicopter',
    title: 'Helicopter',
    description: 'Fliege den Hubschrauber durch die Höhle — halte gedrückt zum Steigen.',
    preview: '/games/helicopter-preview.svg',
    previewAlt: 'Vorschau: ein gelber Helikopter zwischen Felswänden mit Hindernissen',
    category: 'action',
  },
  {
    to: '/hitori',
    title: 'Hitori',
    description: 'Schwärze Zellen, bis keine Duplikate mehr pro Zeile oder Spalte vorkommen.',
    preview: '/games/hitori-preview.svg',
    previewAlt: 'Vorschau: ein 5×5-Gitter mit schwarzen und weißen Zellen mit Ziffern',
    category: 'logik',
  },
  {
    to: '/kakuro',
    title: 'Kakuro',
    description: 'Zahlen-Kreuzworträtsel mit Summenhinweisen. Drei vorgegebene Stufen.',
    preview: '/games/kakuro-preview.svg',
    previewAlt: 'Vorschau: ein Kakuro-Gitter mit Summenhinweisen in schwarzen Diagonalen',
    category: 'logik',
  },
  {
    to: '/kniffel',
    title: 'Kniffel',
    description: 'Würfelspiel mit 13 Kategorien — 3 Würfe pro Runde.',
    preview: '/games/kniffel-preview.svg',
    previewAlt: 'Vorschau: fünf weiße Würfel mit Augen',
    category: 'gehirntraining',
  },
  {
    to: '/crossword',
    title: 'Kreuzworträtsel',
    description: 'Klassisches Kreuzworträtsel mit deutschen Wörtern und Hinweisen.',
    preview: '/games/crossword-preview.svg',
    previewAlt: 'Vorschau: ein Gitter mit schwarzen Feldern und nummerierten Hinweisen',
    category: 'wort',
  },
  {
    to: '/match3',
    title: 'Match-3',
    description: 'Tausche bunte Edelsteine zu Dreierreihen mit Kaskaden-Effekt. 30 Züge.',
    preview: '/games/match3-preview.svg',
    previewAlt: 'Vorschau: ein 8×8-Gitter mit bunten Kugeln, drei in einer Reihe',
    category: 'logik',
  },
];

export const GAMES: GameCard[] = GAME_INPUTS.map(asGame);

export function findGameBySlug(slug: string): GameCard | undefined {
  return GAMES.find((g) => g.slug === slug);
}

export function findGameByPath(pathname: string): GameCard | undefined {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return GAMES.find((g) => g.to === normalized);
}
