import GameLayout from '../components/GameLayout';
import HanoiGame from '../components/HanoiGame';

export default function Hanoi() {
  return (
    <GameLayout
      title="Türme von Hanoi"
      description="Bewege alle Scheiben vom linken zum rechten Stab. Eine größere Scheibe darf nie auf einer kleineren liegen."
    >
      <HanoiGame />
    </GameLayout>
  );
}
