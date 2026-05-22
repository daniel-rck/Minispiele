import GameLayout from '../components/GameLayout';
import MinesweeperHexGame from '../components/MinesweeperHexGame';

export default function MinesweeperHex() {
  return (
    <GameLayout
      title="Hex-Minensucher"
      description="Minesweeper auf Sechseck-Gitter — jedes Feld hat bis zu 6 Nachbarn."
    >
      <MinesweeperHexGame />
    </GameLayout>
  );
}
