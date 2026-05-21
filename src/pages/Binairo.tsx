import BinairoGame from '../components/BinairoGame';
import GameLayout from '../components/GameLayout';

export default function Binairo() {
  return (
    <GameLayout
      title="Binairo"
      description="Fülle das Gitter mit 0 und 1 — höchstens zwei Gleiche nebeneinander."
    >
      <BinairoGame />
    </GameLayout>
  );
}
