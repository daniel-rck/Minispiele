import GameLayout from '../components/GameLayout';
import NurikabeGame from '../components/NurikabeGame';

export default function Nurikabe() {
  return (
    <GameLayout
      title="Nurikabe"
      description="Inseln und Meer: trenne Zahleninseln mit zusammenhängendem Meer ohne 2×2-Blöcke."
    >
      <NurikabeGame />
    </GameLayout>
  );
}
