import GameLayout from '../components/GameLayout';
import LightsOutGame from '../components/LightsOutGame';

export default function LightsOut() {
  return (
    <GameLayout
      title="Lichter aus"
      description="Ein Tipp schaltet das Feld und alle direkten Nachbarn (oben, unten, links, rechts) um. Ziel: alle Lichter ausschalten."
    >
      <LightsOutGame />
    </GameLayout>
  );
}
