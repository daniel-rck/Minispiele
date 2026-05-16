import AnagramGame from '../components/AnagramGame';

export default function Anagram() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Wortsalat</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Die Buchstaben sind durcheinander — bring sie in die richtige Reihenfolge und bilde das
        deutsche Wort.
      </p>
      <AnagramGame />
    </div>
  );
}
