import GameLayout from '../components/GameLayout';
import LaddersGame from '../components/LaddersGame';

export default function Ladders() {
  return (
    <GameLayout
      title="Leiterspiel"
      description="Brettspiel-Klassiker für vier: würfle dich von Feld 1 nach 100, nutze Leitern und vermeide Schlangen. Drei KI-Gegner würfeln nach dir."
    >
      <LaddersGame />
    </GameLayout>
  );
}
