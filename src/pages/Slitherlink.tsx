import GameLayout from '../components/GameLayout';
import SlitherlinkGame from '../components/SlitherlinkGame';

export default function Slitherlink() {
  return (
    <GameLayout
      title="Slitherlink"
      description="Zeichne eine geschlossene Schleife so, dass alle Zahlenhinweise erfüllt sind."
    >
      <SlitherlinkGame />
    </GameLayout>
  );
}
