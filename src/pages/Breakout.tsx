import BreakoutGame from '../components/BreakoutGame';

export default function Breakout() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Ziegelbruch</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Halte den Ball mit dem Paddel im Spiel und räume alle Ziegel ab. Wische oder benutze die
        Pfeiltasten zum Bewegen.
      </p>
      <BreakoutGame />
    </div>
  );
}
