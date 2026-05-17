import GameLayout from '../components/GameLayout';
import ReactionGame from '../components/ReactionGame';

export default function Reaction() {
  return (
    <GameLayout
      title="Reaktionstest"
      description="Wie schnell bist du? Tippe sobald die Fläche grün wird — nicht früher."
    >
      <ReactionGame />
    </GameLayout>
  );
}
