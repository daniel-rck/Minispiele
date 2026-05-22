import GameLayout from '../components/GameLayout';
import HelicopterGame from '../components/HelicopterGame';

export default function Helicopter() {
  return (
    <GameLayout
      title="Helicopter"
      description="Halte den Hubschrauber zwischen Decke und Boden — weiche den Hindernissen aus."
    >
      <HelicopterGame />
    </GameLayout>
  );
}
