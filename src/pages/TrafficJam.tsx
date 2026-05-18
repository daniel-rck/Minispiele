import GameLayout from '../components/GameLayout';
import TrafficJamGame from '../components/TrafficJamGame';

export default function TrafficJam() {
  return (
    <GameLayout
      title="Stau"
      description="Befreie das rote Auto aus dem Verkehrschaos. Schiebe die anderen Wagen aus dem Weg, bis der Weg zur rechten Ausfahrt frei ist."
    >
      <TrafficJamGame />
    </GameLayout>
  );
}
