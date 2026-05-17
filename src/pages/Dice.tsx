import DiceRoller from '../components/DiceRoller';
import GameLayout from '../components/GameLayout';

export default function Dice() {
  return (
    <GameLayout
      title="Würfel"
      description={
        <>
          Stell dir dein Würfelset zusammen — Anzahl, Würfeltyp und Farbe pro Würfel. Tippe einen
          Würfel an, um ihn einzeln neu zu werfen, oder nutze „Halten" für Kniffel-artige Würfe.
        </>
      }
    >
      <DiceRoller />
    </GameLayout>
  );
}
