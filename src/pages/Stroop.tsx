import StroopGame from '../components/StroopGame';

export default function Stroop() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Stroop-Test</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Du siehst Farbnamen — aber in einer anderen Farbe geschrieben. Tippe auf die{' '}
        <strong>Schriftfarbe</strong>, nicht auf das Wort. 30 Sekunden lang so viele wie möglich.
      </p>
      <StroopGame />
    </div>
  );
}
