import GameLayout from '../components/GameLayout';
import PentominoGame from '../components/PentominoGame';

export default function Pentomino() {
  return (
    <GameLayout
      title="Pentomino"
      description="Platziere 12 Pentomino-Teile lückenlos auf einem 6×10-Brett."
    >
      <PentominoGame />
    </GameLayout>
  );
}
