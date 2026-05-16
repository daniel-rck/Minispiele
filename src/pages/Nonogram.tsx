import NonogramGame from '../components/NonogramGame';

export default function Nonogram() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Bildrätsel</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Picross-Logikrätsel: Die Zahlen am Rand verraten, wie viele Felder pro Reihe und Spalte
        zusammenhängend ausgefüllt sein müssen.
      </p>
      <NonogramGame />
    </div>
  );
}
