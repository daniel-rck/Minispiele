import SudokuGame from '../components/SudokuGame';

export default function Sudoku() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Sudoku</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Fülle das 9×9-Gitter so, dass jede Ziffer 1 bis 9 in jeder Zeile, Spalte und jedem 3×3-Block
        genau einmal vorkommt.
      </p>
      <SudokuGame />
    </div>
  );
}
