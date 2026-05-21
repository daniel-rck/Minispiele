import GameLayout from '../components/GameLayout';
import TypingTestGame from '../components/TypingTestGame';

export default function TypingTest() {
  return (
    <GameLayout
      title="Typing Test"
      description="Wie schnell tippst du? Wörter pro Minute (WPM) und Genauigkeit messen."
    >
      <TypingTestGame />
    </GameLayout>
  );
}
