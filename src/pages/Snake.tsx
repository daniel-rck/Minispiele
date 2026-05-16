import SnakeGame from '../components/SnakeGame';

export default function Snake() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Snake</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
        Sammle das Futter und wachse — aber stoße nicht gegen die Wand oder dich selbst. Wische auf
        dem Spielfeld oder benutze die Pfeiltasten / Tasten <code>WASD</code>.
      </p>
      <SnakeGame />
    </div>
  );
}
