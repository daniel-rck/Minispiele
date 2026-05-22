import GameLayout from '../components/GameLayout';
import WhackAMoleGame from '../components/WhackAMoleGame';

export default function WhackAMole() {
  return (
    <GameLayout
      title="Whack-a-Mole"
      description="Erwische die Maulwürfe in 30 Sekunden — sie werden immer schneller."
    >
      <WhackAMoleGame />
    </GameLayout>
  );
}
