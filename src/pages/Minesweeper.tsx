import GameLayout from '../components/GameLayout';
import MinesweeperGame from '../components/MinesweeperGame';

export default function Minesweeper() {
  return (
    <GameLayout
      title="Minensucher"
      description="Decke Felder auf, ohne eine Mine zu erwischen. Die Zahlen zeigen, wie viele Minen direkt angrenzen. Lange drücken oder rechts-klicken (oder den Flaggen-Modus unten) setzt eine Flagge."
      fit="scroll"
    >
      <MinesweeperGame />
    </GameLayout>
  );
}
