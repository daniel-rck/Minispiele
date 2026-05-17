import GameLayout from '../components/GameLayout';
import SnakeGame from '../components/SnakeGame';

export default function Snake() {
  return (
    <GameLayout
      title="Snake"
      description={
        <>
          Sammle das Futter und wachse — aber stoße nicht gegen die Wand oder dich selbst. Wische
          auf dem Spielfeld oder benutze die Pfeiltasten / Tasten <code>WASD</code>.
        </>
      }
    >
      <SnakeGame />
    </GameLayout>
  );
}
