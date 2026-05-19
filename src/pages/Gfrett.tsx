import GameLayout from '../components/GameLayout';
import GfrettGame from '../components/GfrettGame';

export default function Gfrett() {
  return (
    <GameLayout
      title="Gfrett"
      description="Schiebe die Blöcke entlang ihrer Achse vom Feld. Drei gleiche Farben in der Leiste lösen sich auf. Wird die Leiste voll, ist die Runde verloren."
    >
      <GfrettGame />
    </GameLayout>
  );
}
