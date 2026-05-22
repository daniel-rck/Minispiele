import GameLayout from '../components/GameLayout';
import PipePuzzleGame from '../components/PipePuzzleGame';

export default function PipePuzzle() {
  return (
    <GameLayout
      title="Rohre drehen"
      description="Drehe die Rohre, bis alles zu einem zusammenhängenden Netz verbunden ist."
    >
      <PipePuzzleGame />
    </GameLayout>
  );
}
