import ClickerTimer from '../components/ClickerTimer';
import GameLayout from '../components/GameLayout';

export default function Timer() {
  return (
    <GameLayout
      title="Clicker Timer"
      description="Stell eine Dauer ein und tippe auf den großen Knopf. Jeder weitere Tipp startet den Countdown wieder von vorne und stoppt den Alarm."
    >
      <ClickerTimer />
    </GameLayout>
  );
}
