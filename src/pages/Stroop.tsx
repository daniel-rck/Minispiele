import GameLayout from '../components/GameLayout';
import StroopGame from '../components/StroopGame';

export default function Stroop() {
  return (
    <GameLayout
      title="Stroop-Test"
      description={
        <>
          Du siehst Farbnamen — aber in einer anderen Farbe geschrieben. Tippe auf die{' '}
          <strong>Schriftfarbe</strong>, nicht auf das Wort. 30 Sekunden lang so viele wie möglich.
        </>
      }
    >
      <StroopGame />
    </GameLayout>
  );
}
