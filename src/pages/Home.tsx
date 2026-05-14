import { Link } from 'react-router';

interface GameCard {
  to: string;
  title: string;
  description: string;
  emoji: string;
}

const games: GameCard[] = [
  {
    to: '/ring-sort',
    title: 'Ringe sortieren',
    description: 'Sortiere bunte Ringe in drei Farben auf vier Stäben.',
    emoji: '◉',
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
              className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-brand-500 hover:shadow-md transition"
            >
              <div className="text-3xl mb-2" aria-hidden>
                {g.emoji}
              </div>
              <div className="font-semibold text-lg">{g.title}</div>
              <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {g.description}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
