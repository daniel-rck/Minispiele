import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { createInitialState, LIGHTS_SIZE, type LightsState, press } from '../lib/lightsOut';
import { LightsBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import DifficultySelector from './ui/DifficultySelector';
import Sheet from './ui/Sheet';

const DIFFICULTY: Record<'easy' | 'medium' | 'hard', number> = {
  easy: 4,
  medium: 7,
  hard: 12,
};
type Difficulty = keyof typeof DIFFICULTY;

const LABELS: Record<Difficulty, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
};

export default function LightsOutGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [state, setState] = useState<LightsState>(() => createInitialState(DIFFICULTY.medium));
  const [best, setBest] = useLocalStorage<number | null>(
    STORAGE_KEYS.LIGHTS_BEST,
    LightsBestSchema,
    null,
  );
  const [winOpen, setWinOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announce, setAnnounce] = useState('');
  const prevSolvedRef = useRef(false);
  const { vibrate } = useVibration();
  const sfx = useGameSfx();

  useEffect(() => {
    if (state.solved && !prevSolvedRef.current) {
      if (best === null || state.moves < best) {
        setBest(state.moves);
        setScoreIsNew(true);
      } else {
        setScoreIsNew(false);
      }
      setWinOpen(true);
      setAnnounce('Geschafft!');
      vibrate([40, 30, 60]);
      sfx.win();
    }
    prevSolvedRef.current = state.solved;
  }, [state.solved, state.moves, best, setBest, vibrate, sfx]);

  const restart = useCallback(
    (d: Difficulty = difficulty) => {
      setState(createInitialState(DIFFICULTY[d]));
      setWinOpen(false);
      setScoreIsNew(false);
      prevSolvedRef.current = false;
    },
    [difficulty],
  );

  const changeDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    restart(d);
  };

  const handleCell = (idx: number) => {
    if (state.solved) return;
    vibrate(15);
    setState((s) => press(s, idx));
  };

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pb-2">
      <AriaLive message={announce} />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <DifficultySelector<Difficulty>
          value={difficulty}
          options={LABELS}
          onChange={changeDifficulty}
        />
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Züge: <span className="font-semibold tabular-nums">{state.moves}</span>
        </div>
        <div className="text-right">
          {best !== null ? (
            <>
              Best: <span className="font-semibold tabular-nums">{best}</span>
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      </div>

      <div className="fit-area mx-auto w-full max-w-md">
        <div
          className="grid fit-box gap-2 rounded-2xl bg-slate-900 p-3 dark:bg-slate-950"
          style={{ gridTemplateColumns: `repeat(${LIGHTS_SIZE}, minmax(0, 1fr))` }}
          role="grid"
          aria-label="Lichter-Gitter"
        >
          {state.grid.map((on, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleCell(i)}
              disabled={state.solved}
              aria-label={`Licht ${i + 1}, ${on ? 'an' : 'aus'}`}
              aria-pressed={on}
              className={`aspect-square rounded-xl transition-colors ${
                on
                  ? 'bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.55)]'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      <Button variant="primary" block className="max-w-md" onClick={() => restart()}>
        Neues Rätsel
      </Button>

      <p className="max-w-md text-center text-xs text-slate-500">
        Ein Tipp schaltet das Feld und alle direkten Nachbarn um. Ziel: alle Lichter aus.
      </p>

      <Sheet open={winOpen} onClose={() => setWinOpen(false)} title="Geschafft!">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            💡
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestleistung!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Alle Lichter in {state.moves} Zügen ausgeschaltet.
          </p>
          <Button variant="primary" block onClick={() => restart()}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
