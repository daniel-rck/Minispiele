import SokobanGame from '../components/SokobanGame';

export default function Sokoban() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Kistenschieber</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Schiebe alle Kisten auf die markierten Zielfelder. Wisch oder Pfeiltasten zur Steuerung —
        ziehen geht nicht.
      </p>
      <SokobanGame />
    </div>
  );
}
