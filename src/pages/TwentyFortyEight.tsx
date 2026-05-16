import TwentyFortyEightGame from '../components/TwentyFortyEightGame';

export default function TwentyFortyEight() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">2048</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Bewege die Kacheln per Pfeiltaste oder Wischgeste. Gleiche Zahlen verschmelzen zu ihrer
        Summe. Erreiche die 2048-Kachel!
      </p>
      <TwentyFortyEightGame />
    </div>
  );
}
