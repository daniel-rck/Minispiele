import DiceRoller from '../components/DiceRoller';

export default function Dice() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Würfel</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Stell dir dein Würfelset zusammen — Anzahl, Würfeltyp und Farbe pro
        Würfel. Tippe einen Würfel an, um ihn einzeln neu zu werfen, oder nutze
        „Halten" für Kniffel-artige Würfe.
      </p>
      <DiceRoller />
    </div>
  );
}
