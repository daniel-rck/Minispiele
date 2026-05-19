export type Category = 'logik' | 'wort' | 'action' | 'gehirntraining' | 'karten' | 'werkzeuge';

export interface GameCard {
  /** Route path, e.g. "/ring-sort" */
  to: string;
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
  to: string;
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
];

export const GAMES: GameCard[] = GAME_INPUTS.map(asGame);

export function findGameBySlug(slug: string): GameCard | undefined {
  return GAMES.find((g) => g.slug === slug);
}

export function findGameByPath(pathname: string): GameCard | undefined {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return GAMES.find((g) => g.to === normalized);
}
