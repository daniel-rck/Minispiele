import GameLayout from '../components/GameLayout';
import TangramGame from '../components/TangramGame';

export default function Tangram() {
  return (
    <GameLayout
      title="Tangram"
      description="Setze die sieben geometrischen Tangram-Teile zur vorgegebenen Silhouette zusammen."
    >
      <TangramGame />
    </GameLayout>
  );
}
