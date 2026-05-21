import AsteroidsGame from '../components/AsteroidsGame';
import GameLayout from '../components/GameLayout';

export default function Asteroids() {
  return (
    <GameLayout
      title="Asteroids"
      description="Steuere dein Raumschiff durch ein Feld aus Asteroiden. Wickel, beschleunige, schieße."
    >
      <AsteroidsGame />
    </GameLayout>
  );
}
