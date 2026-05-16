import MemoryGame from '../components/MemoryGame';

export default function Memory() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Memory</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Decke zwei gleiche Karten auf. Du kannst zwei Karten pro Zug umdrehen — passen sie nicht
        zusammen, werden sie wieder verdeckt. Finde alle Paare mit möglichst wenigen Zügen.
      </p>
      <MemoryGame />
    </div>
  );
}
