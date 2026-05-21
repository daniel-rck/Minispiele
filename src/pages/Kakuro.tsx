import GameLayout from '../components/GameLayout';
import KakuroGame from '../components/KakuroGame';

export default function Kakuro() {
  return (
    <GameLayout
      title="Kakuro"
      description="Zahlen-Kreuzworträtsel: fülle weiße Zellen mit 1-9 nach den Summenhinweisen."
    >
      <KakuroGame />
    </GameLayout>
  );
}
