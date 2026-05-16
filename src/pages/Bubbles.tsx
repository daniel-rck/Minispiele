import BubblesGame from '../components/BubblesGame';

export default function Bubbles() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Blasenschießen</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Schieße farbige Blasen ab. Drei oder mehr gleichfarbige nebeneinander platzen. Räume das
        Feld ab.
      </p>
      <BubblesGame />
    </div>
  );
}
