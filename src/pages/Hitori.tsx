import GameLayout from '../components/GameLayout';
import HitoriGame from '../components/HitoriGame';

export default function Hitori() {
  return (
    <GameLayout
      title="Hitori"
      description="Schwärze Zellen so, dass keine Zahl pro Zeile / Spalte doppelt vorkommt."
    >
      <HitoriGame />
    </GameLayout>
  );
}
