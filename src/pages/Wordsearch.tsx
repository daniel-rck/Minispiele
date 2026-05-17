import GameLayout from '../components/GameLayout';
import WordsearchGame from '../components/WordsearchGame';

export default function Wordsearch() {
  return (
    <GameLayout
      title="Wortgitter"
      description="Finde die versteckten deutschen Wörter im Buchstaben-Gitter. Markiere ein Wort, indem du vom ersten zum letzten Buchstaben wischst."
    >
      <WordsearchGame />
    </GameLayout>
  );
}
