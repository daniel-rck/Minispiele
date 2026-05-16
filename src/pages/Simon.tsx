import SimonGame from '../components/SimonGame';

export default function Simon() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Simon Says</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Schau zu, wie eine Farb- und Tonfolge wächst. Wiederhole sie in der richtigen Reihenfolge.
        Jeder Erfolg verlängert die Sequenz — wie weit kommst du?
      </p>
      <SimonGame />
    </div>
  );
}
