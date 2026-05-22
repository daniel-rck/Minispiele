import GameLayout from '../components/GameLayout';
import ViergewinntGame from '../components/ViergewinntGame';

export default function Viergewinnt() {
  return (
    <GameLayout
      title="4 Gewinnt"
      description="Vier-in-einer-Reihe gegen die KI mit Minimax und drei Stufen."
    >
      <ViergewinntGame />
    </GameLayout>
  );
}
