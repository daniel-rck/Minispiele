import GameLayout from '../components/GameLayout';
import WordleGame from '../components/WordleGame';

export default function Wordle() {
  return (
    <GameLayout
      title="Wordle"
      description="Errate das fünfbuchstabige Wort in höchstens sechs Versuchen. Grün = richtige Stelle, Gelb = im Wort, aber an anderer Stelle, Grau = nicht im Wort."
    >
      <WordleGame />
    </GameLayout>
  );
}
