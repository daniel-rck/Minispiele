import ReactionGame from '../components/ReactionGame';

export default function Reaction() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Reaktionstest</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Wie schnell bist du? Tippe sobald die Fläche grün wird — nicht früher.
      </p>
      <ReactionGame />
    </div>
  );
}
