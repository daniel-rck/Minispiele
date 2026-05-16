import FlowGame from '../components/FlowGame';

export default function Flow() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Verbinden</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Verbinde gleichfarbige Punkte mit Linien. Linien dürfen sich nicht kreuzen und sollten am
        Ende das ganze Gitter füllen.
      </p>
      <FlowGame />
    </div>
  );
}
