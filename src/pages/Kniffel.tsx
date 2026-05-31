import GameLayout from '../components/GameLayout';
import KniffelGame from '../components/KniffelGame';

export default function Kniffel() {
  return (
    <GameLayout
      title="Kniffel"
      description="Würfelspiel mit 13 Kategorien. 3 Würfe pro Runde, ab 63 Oberteil-Bonus."
      fit="scroll"
    >
      <KniffelGame />
    </GameLayout>
  );
}
