import GameLayout from '../components/GameLayout';
import QwirkleGame from '../components/QwirkleGame';

export default function Qwirkle() {
  return (
    <GameLayout
      title="Qwirkle"
      description="Lege Steine: in jeder Reihe gleiche Farbe oder gleiche Form, keine Duplikate."
    >
      <QwirkleGame />
    </GameLayout>
  );
}
