import HanoiGame from '../components/HanoiGame';

export default function Hanoi() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Türme von Hanoi</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Bewege alle Scheiben vom linken zum rechten Stab. Eine größere Scheibe darf nie auf einer
        kleineren liegen.
      </p>
      <HanoiGame />
    </div>
  );
}
