import FroggerGame from '../components/FroggerGame';
import GameLayout from '../components/GameLayout';

export default function Frogger() {
  return (
    <GameLayout
      title="Frogger"
      description="Führe den Frosch über Straße und Fluss in die Zielreihe."
    >
      <FroggerGame />
    </GameLayout>
  );
}
