import GameLayout from '../components/GameLayout';
import HangmanGame from '../components/HangmanGame';

export default function Hangman() {
  return (
    <GameLayout
      title="Galgenmännchen"
      description="Errate das Wort Buchstabe für Buchstabe. Bei zehn Fehlversuchen ist der Galgen fertig."
    >
      <HangmanGame />
    </GameLayout>
  );
}
