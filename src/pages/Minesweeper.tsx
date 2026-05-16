import MinesweeperGame from '../components/MinesweeperGame';

export default function Minesweeper() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Minensucher</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Decke Felder auf, ohne eine Mine zu erwischen. Die Zahlen zeigen, wie viele Minen direkt
        angrenzen. Lange drücken oder rechts-klicken (oder den Flaggen-Modus unten) setzt eine
        Flagge.
      </p>
      <MinesweeperGame />
    </div>
  );
}
