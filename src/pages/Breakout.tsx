import BreakoutGame from '../components/BreakoutGame';
import GameLayout from '../components/GameLayout';

export default function Breakout() {
  return (
    <GameLayout
      title="Ziegelbruch"
      description="Halte den Ball mit dem Paddel im Spiel und räume alle Ziegel ab. Wische oder benutze die Pfeiltasten zum Bewegen."
    >
      <BreakoutGame />
    </GameLayout>
  );
}
