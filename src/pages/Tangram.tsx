import TangramGame from '../components/TangramGame';

export default function Tangram() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Tangram</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Setze die sieben geometrischen Tangram-Teile zur vorgegebenen Silhouette zusammen.
      </p>
      <TangramGame />
    </div>
  );
}
