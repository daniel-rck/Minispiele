import GameLayout from '../components/GameLayout';
import HalmaGame from '../components/HalmaGame';

export default function Halma() {
  return (
    <GameLayout
      title="Halma"
      description="Bring alle blauen Steine in die gegenüberliegende Ecke — Springe gegen die KI."
    >
      <HalmaGame />
    </GameLayout>
  );
}
