import GameLayout from '../components/GameLayout';
import GameOfLifeGame from '../components/GameOfLifeGame';

export default function GameOfLife() {
  return (
    <GameLayout
      title="Game of Life"
      description="Conways Zellularautomat — zeichne Muster und beobachte ihre Entwicklung."
    >
      <GameOfLifeGame />
    </GameLayout>
  );
}
