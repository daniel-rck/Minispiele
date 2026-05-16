import MastermindGame from '../components/MastermindGame';

export default function Mastermind() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Codeknacker</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Errate die 4-Farben-Kombination des Computers in zehn Versuchen. Schwarz =
        Farbe&nbsp;und&nbsp;Position korrekt, Weiß = Farbe richtig, aber Position falsch.
      </p>
      <MastermindGame />
    </div>
  );
}
