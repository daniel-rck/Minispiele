import ColorFloodGame from '../components/ColorFloodGame';
import GameLayout from '../components/GameLayout';

export default function ColorFlood() {
  return (
    <GameLayout
      title="Farbflut"
      description="Färbe das Feld von oben links beginnend ein. Schaffe es in möglichst wenigen Zügen, alles in eine Farbe zu verwandeln."
    >
      <ColorFloodGame />
    </GameLayout>
  );
}
