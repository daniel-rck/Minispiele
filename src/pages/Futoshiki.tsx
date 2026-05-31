import FutoshikiGame from '../components/FutoshikiGame';
import GameLayout from '../components/GameLayout';

export default function Futoshiki() {
  return (
    <GameLayout
      title="Futoshiki"
      description="Latein-Quadrat mit Vergleichszeichen — fülle das Gitter mit 1 bis N."
      fit="scroll"
    >
      <FutoshikiGame />
    </GameLayout>
  );
}
