import FlappyBirdGame from '../components/FlappyBirdGame';
import GameLayout from '../components/GameLayout';

export default function FlappyBird() {
  return (
    <GameLayout
      title="Flappy Bird"
      description="Tippe oder klicke, um den Vogel durch die Rohrenlücken zu flattern."
    >
      <FlappyBirdGame />
    </GameLayout>
  );
}
