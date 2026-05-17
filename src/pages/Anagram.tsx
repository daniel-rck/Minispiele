import AnagramGame from '../components/AnagramGame';
import GameLayout from '../components/GameLayout';

export default function Anagram() {
  return (
    <GameLayout
      title="Wortsalat"
      description="Die Buchstaben sind durcheinander — bring sie in die richtige Reihenfolge und bilde das deutsche Wort."
    >
      <AnagramGame />
    </GameLayout>
  );
}
