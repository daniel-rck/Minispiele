import ClickerTimer from '../components/ClickerTimer';

export default function Timer() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Clicker Timer</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Stell eine Dauer ein und tippe auf den großen Knopf. Jeder weitere Tipp startet den
        Countdown wieder von vorne und stoppt den Alarm.
      </p>
      <ClickerTimer />
    </div>
  );
}
