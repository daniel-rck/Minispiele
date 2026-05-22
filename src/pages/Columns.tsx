import ColumnsGame from '../components/ColumnsGame';
import GameLayout from '../components/GameLayout';

export default function Columns() {
  return (
    <GameLayout
      title="Columns"
      description="Drei farbige Steine fallen herunter. Bilde Reihen aus drei oder mehr gleichen Farben."
    >
      <ColumnsGame />
    </GameLayout>
  );
}
