import GameLayout from '../components/GameLayout';
import VierBilderGame from '../components/VierBilderGame';

export default function VierBilder() {
  return (
    <GameLayout
      title="4 Bilder 1 Wort"
      description="Vier Emojis ergeben ein gemeinsames Wort. 30 Rätsel."
    >
      <VierBilderGame />
    </GameLayout>
  );
}
