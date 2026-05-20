import GameLayout from '../components/GameLayout';
import SpellingBeeGame from '../components/SpellingBeeGame';

export default function SpellingBee() {
  return (
    <GameLayout
      title="Buchstabierbiene"
      description="Bilde Wörter aus sieben Buchstaben — der mittlere muss in jedem Wort vorkommen. Pangrams geben Bonuspunkte."
    >
      <SpellingBeeGame />
    </GameLayout>
  );
}
