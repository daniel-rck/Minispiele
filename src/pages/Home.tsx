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
];

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Minispiele</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        Kleine Browser-Spiele. Lokal, ohne Account, ohne Tracking.
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="p-5">
                <div className="font-semibold text-lg">{g.title}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {g.description}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
