import { Link } from 'react-router';

interface GameCard {
  to: string;
  title: string;
  description: string;
  preview: string;
  previewAlt: string;
}

const games: GameCard[] = [
  {
    to: '/ring-sort',
    title: 'Ringe sortieren',
    description: 'Sortiere bunte Ringe in drei Farben auf vier Stäben.',
    preview: '/games/ring-sort-preview.svg',
    previewAlt: 'Vorschau: vier Stäbe mit gestapelten roten, blauen und grünen Ringen',
  },
  {
    to: '/timer',
    title: 'Clicker Timer',
    description: 'Countdown einstellen. Jeder Tipp startet ihn neu und beendet den Alarm.',
    preview: '/games/timer-preview.svg',
    previewAlt: 'Vorschau: ein Stoppuhr-Zifferblatt mit Countdown',
  },
  {
    to: '/dice',
    title: 'Würfel',
    description:
      'Würfelset zum Pen-and-Paper-Spielen: Kniffel, Mäxle & mehr — frei konfigurierbar.',
    preview: '/games/dice-preview.svg',
    previewAlt: 'Vorschau: drei farbige Würfel mit Augen',
  },
  {
    to: '/memory',
    title: 'Memory',
    description: 'Finde alle Paare mit möglichst wenigen Zügen. Drei Schwierigkeitsstufen.',
    preview: '/games/memory-preview.svg',
    previewAlt: 'Vorschau: ein Raster mit teilweise aufgedeckten Karten',
  },
  {
    to: '/twenty-forty-eight',
    title: '2048',
    description: 'Wische Kacheln zusammen, bis die 2048 erscheint. Pfeiltasten oder Touch.',
    preview: '/games/twenty-forty-eight-preview.svg',
    previewAlt: 'Vorschau: ein 4×4-Raster mit Zahlenkacheln',
  },
  {
    to: '/sliding-puzzle',
    title: 'Schiebepuzzle',
    description: 'Klassisches 15er-Puzzle — schiebe Plättchen in die richtige Reihenfolge.',
    preview: '/games/sliding-puzzle-preview.svg',
    previewAlt: 'Vorschau: ein 4×4-Raster mit nummerierten Plättchen und einer Lücke',
  },
  {
    to: '/simon',
    title: 'Simon Says',
    description: 'Merke dir wachsende Farb- und Tonfolgen und wiederhole sie korrekt.',
    preview: '/games/simon-preview.svg',
    previewAlt:
      'Vorschau: vier farbige Viertelkreise (grün, rot, gelb, blau) um eine zentrale Scheibe',
  },
  {
    to: '/minesweeper',
    title: 'Minensucher',
    description: 'Decke Felder auf, ohne eine Mine zu treffen. Drei Schwierigkeitsstufen.',
    preview: '/games/minesweeper-preview.svg',
    previewAlt: 'Vorschau: ein Raster mit aufgedeckten Zahlen, Flaggen und einer sichtbaren Mine',
  },
  {
    to: '/snake',
    title: 'Snake',
    description: 'Sammle Futter, wachse und kollidiere nicht. Wisch- oder Pfeiltasten-Steuerung.',
    preview: '/games/snake-preview.svg',
    previewAlt: 'Vorschau: eine grüne Schlange auf dunklem Raster mit rotem Apfel',
  },
  {
    to: '/wordle',
    title: 'Wordle',
    description: 'Errate das 5-Buchstaben-Wort in sechs Versuchen — mit Farbfeedback.',
    preview: '/games/wordle-preview.svg',
    previewAlt: 'Vorschau: ein Raster mit teils grün, gelb und grau eingefärbten Buchstabenfeldern',
  },
  {
    to: '/sudoku',
    title: 'Sudoku',
    description: 'Fülle das 9×9-Gitter so, dass jede Zahl pro Zeile, Spalte und Block vorkommt.',
    preview: '/games/sudoku-preview.svg',
    previewAlt: 'Vorschau: ein 9×9-Sudoku-Gitter mit teils gefüllten Zellen',
  },
  {
    to: '/nonogram',
    title: 'Bildrätsel',
    description: 'Picross: füll die Zellen anhand der Zahlenhinweise, bis ein Bild entsteht.',
    preview: '/games/nonogram-preview.svg',
    previewAlt: 'Vorschau: ein Nonogramm mit gefüllten Zellen und Zahlen am Rand',
  },
  {
    to: '/lights-out',
    title: 'Lichter aus',
    description: 'Ein Tipp schaltet ein Feld und seine Nachbarn um. Schalte alle Lichter aus.',
    preview: '/games/lights-out-preview.svg',
    previewAlt: 'Vorschau: 5×5-Gitter mit teils leuchtenden Feldern',
  },
  {
    to: '/mastermind',
    title: 'Codeknacker',
    description: 'Errate die 4-Farben-Kombination des Computers in zehn Versuchen.',
    preview: '/games/mastermind-preview.svg',
    previewAlt: 'Vorschau: Reihen farbiger Steine mit kleinen Bewertungsmarkern',
  },
  {
    to: '/hanoi',
    title: 'Türme von Hanoi',
    description: 'Bewege alle Scheiben vom linken zum rechten Stab. Möglichst wenige Züge.',
    preview: '/games/hanoi-preview.svg',
    previewAlt: 'Vorschau: drei Stäbe mit gestapelten farbigen Scheiben',
  },
  {
    to: '/sokoban',
    title: 'Kistenschieber',
    description: 'Schiebe Kisten auf die markierten Zielfelder im Lagerhaus-Puzzle.',
    preview: '/games/sokoban-preview.svg',
    previewAlt: 'Vorschau: Lagerhaus-Gitter mit Spielfigur, Kisten und Zielen',
  },
  {
    to: '/flow',
    title: 'Verbinden',
    description: 'Zeichne Linien zwischen gleichfarbigen Punkten ohne sich zu kreuzen.',
    preview: '/games/flow-preview.svg',
    previewAlt: 'Vorschau: ein Gitter mit farbigen Endpunkten und verbindenden Linien',
  },
  {
    to: '/tangram',
    title: 'Tangram',
    description: 'Setze sieben geometrische Teile zu vorgegebenen Silhouetten zusammen.',
    preview: '/games/tangram-preview.svg',
    previewAlt: 'Vorschau: sieben geometrische Tangram-Teile in Quadratform',
  },
  {
    to: '/freecell',
    title: 'FreeCell',
    description: 'Klassische Solitär-Variante: sortiere alle Karten auf die vier Foundations.',
    preview: '/games/freecell-preview.svg',
    previewAlt: 'Vorschau: vier freie Zellen, vier Foundations und Tableau-Stapel mit Karten',
  },
  {
    to: '/hangman',
    title: 'Galgenmännchen',
    description: 'Errate das Wort Buchstabe für Buchstabe — bevor der Galgen fertig ist.',
    preview: '/games/hangman-preview.svg',
    previewAlt: 'Vorschau: ein Galgen-Strichgerüst und Unterstriche für Buchstaben',
  },
  {
    to: '/wordsearch',
    title: 'Wortgitter',
    description: 'Finde versteckte deutsche Wörter im Buchstaben-Gitter — horizontal und vertikal.',
    preview: '/games/wordsearch-preview.svg',
    previewAlt: 'Vorschau: ein Gitter aus Buchstaben mit markierten Wörtern',
  },
  {
    to: '/anagram',
    title: 'Wortsalat',
    description: 'Aus durcheinander gewürfelten Buchstaben das richtige Wort bilden.',
    preview: '/games/anagram-preview.svg',
    previewAlt: 'Vorschau: einzelne Buchstabenkacheln in zufälliger Reihenfolge',
  },
  {
    to: '/breakout',
    title: 'Ziegelbruch',
    description: 'Halte den Ball im Spiel und räume alle Ziegel ab. Bewege das Paddel per Wisch.',
    preview: '/games/breakout-preview.svg',
    previewAlt: 'Vorschau: bunte Ziegelreihen, Ball und Paddel am unteren Bildrand',
  },
  {
    to: '/bubbles',
    title: 'Blasenschießen',
    description: 'Schieße farbige Blasen ab und bringe drei oder mehr gleichfarbige zum Platzen.',
    preview: '/games/bubbles-preview.svg',
    previewAlt: 'Vorschau: farbige Blasen im oberen Bereich, Schussvorrichtung unten',
  },
  {
    to: '/blocks',
    title: 'Blockstapler',
    description: 'Fallende Blöcke drehen und einreihen — vollständige Reihen verschwinden.',
    preview: '/games/blocks-preview.svg',
    previewAlt: 'Vorschau: ein hoher Schacht mit gestapelten farbigen Blöcken',
  },
  {
    to: '/reaction',
    title: 'Reaktionstest',
    description: 'Wie schnell bist du? Tippe sobald die Fläche grün wird — nicht früher.',
    preview: '/games/reaction-preview.svg',
    previewAlt: 'Vorschau: eine grüne Fläche mit dem Wort JETZT!',
  },
  {
    to: '/schulte',
    title: 'Zahlentafel',
    description: 'Tippe die Zahlen 1 bis 25 der Schulte-Tabelle der Reihe nach an.',
    preview: '/games/schulte-preview.svg',
    previewAlt: 'Vorschau: ein 5×5-Gitter mit zufällig verteilten Zahlen',
  },
  {
    to: '/stroop',
    title: 'Stroop-Test',
    description: 'Tippe auf die Schriftfarbe — nicht auf das Wort. 30 Sekunden lang.',
    preview: '/games/stroop-preview.svg',
    previewAlt: 'Vorschau: das Wort BLAU in roter Schrift, darunter vier Farbtasten',
  },
];

const NEW_GAME_ISSUE_URL =
  'https://github.com/daniel-rck/minispiele/issues/new?template=new-game.yml';

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Minispiele</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        Kleine Browser-Spiele. Lokal, ohne Account, ohne Tracking.
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4">
        {games.map((g) => (
          <li key={g.to}>
            <Link
              to={g.to}
              className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-brand-500 hover:shadow-md transition"
            >
              <img
                src={g.preview}
                alt={g.previewAlt}
                loading="lazy"
                className="w-full aspect-[16/9] object-cover bg-slate-100 dark:bg-slate-800"
              />
              <div className="p-3 sm:p-5">
                <div className="font-semibold text-base sm:text-lg">{g.title}</div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {g.description}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/50 p-6 text-center dark:border-slate-700 dark:bg-slate-900/50">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Du vermisst ein Spiel? Schlag es vor — wir bauen es vielleicht.
        </p>
        <a
          href={NEW_GAME_ISSUE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
        >
          <span aria-hidden className="mr-2">
            🎮
          </span>
          Neues Spiel vorschlagen
        </a>
        <span className="text-xs text-slate-500">Öffnet ein GitHub-Issue mit kurzem Formular.</span>
      </div>
    </div>
  );
}
