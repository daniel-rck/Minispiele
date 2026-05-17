import FreecellGame from '../components/FreecellGame';
import GameLayout from '../components/GameLayout';

export default function Freecell() {
  return (
    <GameLayout
      title="FreeCell"
      description="Sortiere alle Karten nach Farbe auf die vier Foundations. Vier freie Zellen helfen dir bei komplizierten Zügen."
    >
      <FreecellGame />
    </GameLayout>
  );
}
