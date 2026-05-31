import GameLayout from '../components/GameLayout';
import WuerfelpokerGame from '../components/WuerfelpokerGame';

export default function Wuerfelpoker() {
  return (
    <GameLayout
      title="Würfelpoker"
      description="5 Würfel, 3 Würfe — bilde die beste Pokerhand gegen die KI."
      fit="scroll"
    >
      <WuerfelpokerGame />
    </GameLayout>
  );
}
