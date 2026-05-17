import GameLayout from '../components/GameLayout';
import SlidingPuzzleGame from '../components/SlidingPuzzleGame';

export default function SlidingPuzzle() {
  return (
    <GameLayout
      title="Schiebepuzzle"
      description="Schiebe die Plättchen in die richtige Reihenfolge — von oben links nach unten rechts. Du kannst nur Plättchen verschieben, die direkt neben der leeren Stelle liegen."
    >
      <SlidingPuzzleGame />
    </GameLayout>
  );
}
