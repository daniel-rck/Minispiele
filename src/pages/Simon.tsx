import GameLayout from '../components/GameLayout';
import SimonGame from '../components/SimonGame';

export default function Simon() {
  return (
    <GameLayout
      title="Simon Says"
      description="Schau zu, wie eine Farb- und Tonfolge wächst. Wiederhole sie in der richtigen Reihenfolge. Jeder Erfolg verlängert die Sequenz — wie weit kommst du?"
    >
      <SimonGame />
    </GameLayout>
  );
}
