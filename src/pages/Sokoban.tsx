import GameLayout from '../components/GameLayout';
import SokobanGame from '../components/SokobanGame';

export default function Sokoban() {
  return (
    <GameLayout
      title="Kistenschieber"
      description="Schiebe alle Kisten auf die markierten Zielfelder. Wisch oder Pfeiltasten zur Steuerung — ziehen geht nicht."
    >
      <SokobanGame />
    </GameLayout>
  );
}
