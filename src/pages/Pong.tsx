import GameLayout from '../components/GameLayout';
import PongGame from '../components/PongGame';

export default function Pong() {
  return (
    <GameLayout
      title="Pong"
      description="Tischtennis gegen den Computer — erster Spieler mit 11 Punkten gewinnt."
    >
      <PongGame />
    </GameLayout>
  );
}
