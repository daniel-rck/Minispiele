import GameLayout from '../components/GameLayout';
import MemoryGame from '../components/MemoryGame';

export default function Memory() {
  return (
    <GameLayout
      title="Memory"
      description="Decke zwei gleiche Karten auf. Du kannst zwei Karten pro Zug umdrehen — passen sie nicht zusammen, werden sie wieder verdeckt. Finde alle Paare mit möglichst wenigen Zügen."
    >
      <MemoryGame />
    </GameLayout>
  );
}
