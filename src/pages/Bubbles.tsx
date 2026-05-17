import BubblesGame from '../components/BubblesGame';
import GameLayout from '../components/GameLayout';

export default function Bubbles() {
  return (
    <GameLayout
      title="Blasenschießen"
      description="Schieße farbige Blasen ab. Drei oder mehr gleichfarbige nebeneinander platzen. Räume das Feld ab."
    >
      <BubblesGame />
    </GameLayout>
  );
}
