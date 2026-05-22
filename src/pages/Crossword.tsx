import CrosswordGame from '../components/CrosswordGame';
import GameLayout from '../components/GameLayout';

export default function Crossword() {
  return (
    <GameLayout
      title="Kreuzworträtsel"
      description="Klassisches Kreuzworträtsel mit deutschen Wörtern und Hinweisen."
    >
      <CrosswordGame />
    </GameLayout>
  );
}
