import GameLayout from '../components/GameLayout';
import SlotMachineGame from '../components/SlotMachineGame';

export default function SlotMachine() {
  return (
    <GameLayout
      title="Einarmiger Bandit"
      description="Drei Walzen, sieben Symbole. Setze und drehe — finde dein Glück mit Doppelkirschen, Glocken oder dem Jackpot."
    >
      <SlotMachineGame />
    </GameLayout>
  );
}
