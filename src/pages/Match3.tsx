import GameLayout from '../components/GameLayout';
import Match3Game from '../components/Match3Game';

export default function Match3() {
  return (
    <GameLayout
      title="Match-3"
      description="Tausche Edelsteine, bilde Dreierreihen, jage Kaskaden — 30 Züge."
    >
      <Match3Game />
    </GameLayout>
  );
}
