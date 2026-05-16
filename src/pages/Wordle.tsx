import WordleGame from '../components/WordleGame';

export default function Wordle() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Wordle</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Errate das fünfbuchstabige Wort in höchstens sechs Versuchen. Grün = richtige Stelle, Gelb =
        im Wort, aber an anderer Stelle, Grau = nicht im Wort.
      </p>
      <WordleGame />
    </div>
  );
}
