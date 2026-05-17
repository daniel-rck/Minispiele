import FlowGame from '../components/FlowGame';
import GameLayout from '../components/GameLayout';

export default function Flow() {
  return (
    <GameLayout
      title="Verbinden"
      description="Verbinde gleichfarbige Punkte mit Linien. Linien dürfen sich nicht kreuzen und sollten am Ende das ganze Gitter füllen."
    >
      <FlowGame />
    </GameLayout>
  );
}
