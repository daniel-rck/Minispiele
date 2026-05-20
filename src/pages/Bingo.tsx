import BingoGame from '../components/BingoGame';
import GameLayout from '../components/GameLayout';

export default function Bingo() {
  return (
    <GameLayout
      title="Bingo"
      description="Spiele mit zwei Karten gleichzeitig. Bei jedem Zug wird die Zahl automatisch markiert — wer zuerst eine Reihe, Spalte oder Diagonale schließt, gewinnt."
    >
      <BingoGame />
    </GameLayout>
  );
}
