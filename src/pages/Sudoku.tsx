import GameLayout from '../components/GameLayout';
import SudokuGame from '../components/SudokuGame';

export default function Sudoku() {
  return (
    <GameLayout
      title="Sudoku"
      description="Fülle das 9×9-Gitter so, dass jede Ziffer 1 bis 9 in jeder Zeile, Spalte und jedem 3×3-Block genau einmal vorkommt."
    >
      <SudokuGame />
    </GameLayout>
  );
}
