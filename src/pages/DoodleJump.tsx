import DoodleJumpGame from '../components/DoodleJumpGame';
import GameLayout from '../components/GameLayout';

export default function DoodleJump() {
  return (
    <GameLayout
      title="Doodle Jump"
      description="Springe von Plattform zu Plattform und steige so hoch wie möglich."
    >
      <DoodleJumpGame />
    </GameLayout>
  );
}
