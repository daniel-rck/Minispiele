import GameLayout from '../components/GameLayout';
import RingSortGame from '../components/RingSortGame';

export default function RingSort() {
  return (
    <GameLayout
      title="Ringe sortieren"
      description="Tippe auf einen Stab, um den obersten Ring auszuwählen, und dann auf den Zielstab. Klassisch darf ein Ring nur auf einen leeren Stab oder auf einen Ring gleicher Farbe gelegt werden — mit aktiviertem „Farbmix erlaubt“ passt jede Farbe auf jede."
    >
      <RingSortGame />
    </GameLayout>
  );
}
