import SlidingPuzzleGame from '../components/SlidingPuzzleGame';

export default function SlidingPuzzle() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Schiebepuzzle</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Schiebe die Plättchen in die richtige Reihenfolge — von oben links nach unten rechts. Du
        kannst nur Plättchen verschieben, die direkt neben der leeren Stelle liegen.
      </p>
      <SlidingPuzzleGame />
    </div>
  );
}
