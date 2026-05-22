import ConwayBattleGame from '../components/ConwayBattleGame';
import GameLayout from '../components/GameLayout';

export default function ConwayBattle() {
  return (
    <GameLayout
      title="Conway Battle"
      description="Platziere blaue Zellen, starte die Simulation und überlebe gegen die rote KI."
    >
      <ConwayBattleGame />
    </GameLayout>
  );
}
