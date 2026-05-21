import GameLayout from '../components/GameLayout';
import TicTacToeGame from '../components/TicTacToeGame';

export default function TicTacToe() {
  return (
    <GameLayout
      title="Tic-Tac-Toe"
      description="Drei in einer Reihe gegen die KI — drei Schwierigkeitsstufen mit Minimax."
    >
      <TicTacToeGame />
    </GameLayout>
  );
}
