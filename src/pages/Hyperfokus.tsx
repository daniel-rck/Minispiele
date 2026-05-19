import GameLayout from '../components/GameLayout';
import HyperfokusGame from '../components/HyperfokusGame';

export default function Hyperfokus() {
  return (
    <GameLayout
      title="Hyperfokus"
      description="Tippe den Kern. Sammle Coins, baue Combos, kassiere Crits. Upgrades, Auto-Tapper, zufällige Ereignisse und Prestige halten dich im Flow."
    >
      <HyperfokusGame />
    </GameLayout>
  );
}
