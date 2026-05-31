import GameLayout from '../components/GameLayout';
import QuizGame from '../components/QuizGame';

export default function Quiz() {
  return (
    <GameLayout
      title="Quiz"
      description="Allgemeinwissen — 10 Fragen aus gemischten Kategorien."
      fit="scroll"
    >
      <QuizGame />
    </GameLayout>
  );
}
