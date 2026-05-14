import RingSortGame from '../components/RingSortGame';

export default function RingSort() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Ringe sortieren</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Tippe auf einen Stab, um den obersten Ring auszuwählen, und dann auf den
        Zielstab. Ein Ring darf nur auf einen leeren Stab oder auf einen Ring
        gleicher Farbe gelegt werden.
      </p>
      <RingSortGame />
    </div>
  );
}
