import GameLayout from '../components/GameLayout';
import TwentyFortyEightGame from '../components/TwentyFortyEightGame';

export default function TwentyFortyEight() {
  return (
    <GameLayout
      title="2048"
      description="Bewege die Kacheln per Pfeiltaste oder Wischgeste. Gleiche Zahlen verschmelzen zu ihrer Summe. Erreiche die 2048-Kachel!"
    >
      <TwentyFortyEightGame />
    </GameLayout>
  );
}
