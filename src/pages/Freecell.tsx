import FreecellGame from '../components/FreecellGame';

export default function Freecell() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">FreeCell</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Sortiere alle Karten nach Farbe auf die vier Foundations. Vier freie Zellen helfen dir bei
        komplizierten Zügen.
      </p>
      <FreecellGame />
    </div>
  );
}
