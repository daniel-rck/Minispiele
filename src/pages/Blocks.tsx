import BlocksGame from '../components/BlocksGame';

export default function Blocks() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Blockstapler</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Drehe und positioniere fallende Blöcke. Volle Reihen verschwinden — wie weit kommst du?
      </p>
      <BlocksGame />
    </div>
  );
}
