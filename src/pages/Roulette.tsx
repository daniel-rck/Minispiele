import GameLayout from '../components/GameLayout';
import RouletteGame from '../components/RouletteGame';

export default function Roulette() {
  return (
    <GameLayout
      title="Roulette"
      description="Casino-Roulette. Setze auf Zahlen, Farben oder Gruppen — Rien ne va plus!"
    >
      <RouletteGame />
    </GameLayout>
  );
}
