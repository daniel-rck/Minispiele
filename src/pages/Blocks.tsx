import BlocksGame from '../components/BlocksGame';
import GameLayout from '../components/GameLayout';

export default function Blocks() {
  return (
    <GameLayout
      title="Blockstapler"
      description="Drehe und positioniere fallende Blöcke. Volle Reihen verschwinden — wie weit kommst du?"
    >
      <BlocksGame />
    </GameLayout>
  );
}
