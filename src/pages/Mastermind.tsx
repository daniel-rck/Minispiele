import GameLayout from '../components/GameLayout';
import MastermindGame from '../components/MastermindGame';

export default function Mastermind() {
  return (
    <GameLayout
      title="Codeknacker"
      description={
        <>
          Errate die 4-Farben-Kombination des Computers in zehn Versuchen. Schwarz =
          Farbe&nbsp;und&nbsp;Position korrekt, Weiß = Farbe richtig, aber Position falsch.
        </>
      }
    >
      <MastermindGame />
    </GameLayout>
  );
}
