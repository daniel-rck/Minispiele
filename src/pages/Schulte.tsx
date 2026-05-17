import GameLayout from '../components/GameLayout';
import SchulteGame from '../components/SchulteGame';

export default function Schulte() {
  return (
    <GameLayout
      title="Zahlentafel"
      description="Tippe die Zahlen der Schulte-Tabelle in aufsteigender Reihenfolge an. Konzentration und peripheres Sehen werden trainiert."
    >
      <SchulteGame />
    </GameLayout>
  );
}
