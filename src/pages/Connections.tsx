import ConnectionsGame from '../components/ConnectionsGame';
import GameLayout from '../components/GameLayout';

export default function Connections() {
  return (
    <GameLayout
      title="Connections"
      description="Finde 4 Gruppen von je 4 zusammengehörigen Wörtern — höchstens 4 Fehler."
    >
      <ConnectionsGame />
    </GameLayout>
  );
}
