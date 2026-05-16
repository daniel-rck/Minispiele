import LightsOutGame from '../components/LightsOutGame';

export default function LightsOut() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Lichter aus</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Ein Tipp schaltet das Feld und alle direkten Nachbarn (oben, unten, links, rechts) um. Ziel:
        alle Lichter ausschalten.
      </p>
      <LightsOutGame />
    </div>
  );
}
