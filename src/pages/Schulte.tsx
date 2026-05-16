import SchulteGame from '../components/SchulteGame';

export default function Schulte() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Zahlentafel</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Tippe die Zahlen der Schulte-Tabelle in aufsteigender Reihenfolge an. Konzentration und
        peripheres Sehen werden trainiert.
      </p>
      <SchulteGame />
    </div>
  );
}
