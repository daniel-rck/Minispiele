import GameLayout from '../components/GameLayout';
import NonogramGame from '../components/NonogramGame';

export default function Nonogram() {
  return (
    <GameLayout
      title="Bildrätsel"
      description="Picross-Logikrätsel: Die Zahlen am Rand verraten, wie viele Felder pro Reihe und Spalte zusammenhängend ausgefüllt sein müssen."
    >
      <NonogramGame />
    </GameLayout>
  );
}
