import GameLayout from '../components/GameLayout';
import IdleClickerGame from '../components/IdleClickerGame';

export default function IdleClicker() {
  return (
    <GameLayout
      title="Klick-Imperium"
      description="Klicke für Punkte, kaufe Upgrades, automatisiere die Produktion und triggere Prestige, um deinen Multiplikator dauerhaft zu erhöhen."
    >
      <IdleClickerGame />
    </GameLayout>
  );
}
