import GameLayout from '../components/GameLayout';
import MillionaerGame from '../components/MillionaerGame';

export default function Millionaer() {
  return (
    <GameLayout
      title="Wer wird Millionär"
      description="Quiz mit 15 Fragen, drei Jokern (50:50, Publikum, Telefon) und Sicherheitsstufen."
    >
      <MillionaerGame />
    </GameLayout>
  );
}
