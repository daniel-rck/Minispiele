import { useCallback, useEffect, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { CONNECTIONS_PUZZLES, type ConnectionsGroup } from '../lib/connectionsPuzzles';
import { useGameSfx } from '../lib/useGameSfx';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const MAX_MISTAKES = 4;
const GROUP_SIZE = 4;

interface State {
  puzzleIndex: number;
  remaining: string[];
  selected: Set<string>;
  solved: ConnectionsGroup[];
  mistakes: number;
  over: boolean;
}

function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = out[i];
    const b = out[j];
    if (a !== undefined && b !== undefined) {
      out[i] = b;
      out[j] = a;
    }
  }
  return out;
}

function newState(): State {
  const puzzleIndex = Math.floor(Math.random() * CONNECTIONS_PUZZLES.length);
  const puzzle = CONNECTIONS_PUZZLES[puzzleIndex] ?? CONNECTIONS_PUZZLES[0];
  if (!puzzle) throw new Error('No Connections puzzles available');
  const words = puzzle.groups.flatMap((g) => g.words);
  return {
    puzzleIndex,
    remaining: shuffle(words),
    selected: new Set(),
    solved: [],
    mistakes: 0,
    over: false,
  };
}

export default function ConnectionsGame() {
  const [state, setState] = useState<State>(() => newState());
  const [announcement, setAnnouncement] = useState(
    'Finde 4 Gruppen mit je 4 zusammengehörigen Wörtern.',
  );

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback(() => {
    setState(newState());
    setAnnouncement('Neues Rätsel gestartet.');
  }, []);

  useEffect(() => {
    if (state.solved.length === 4 && !state.over) {
      setAnnouncement('Alle Gruppen gefunden! Perfekt.');
    }
  }, [state.over, state.solved.length]);

  const toggleWord = useCallback(
    (word: string) => {
      if (state.over) return;
      setState((s) => {
        const next = new Set(s.selected);
        if (next.has(word)) next.delete(word);
        else if (next.size < GROUP_SIZE) next.add(word);
        return { ...s, selected: next };
      });
    },
    [state.over],
  );

  const clearSelection = useCallback(() => {
    setState((s) => ({ ...s, selected: new Set() }));
  }, []);

  const submit = useCallback(() => {
    if (state.selected.size !== GROUP_SIZE || state.over) return;
    const puzzle = CONNECTIONS_PUZZLES[state.puzzleIndex];
    if (!puzzle) return;
    const sel = [...state.selected];
    const match = puzzle.groups.find(
      (g) => !state.solved.includes(g) && g.words.every((w) => sel.includes(w)),
    );
    if (match) {
      sfx.win();
      vibrate([40, 30, 80]);
      setState((s) => ({
        ...s,
        solved: [...s.solved, match],
        remaining: s.remaining.filter((w) => !sel.includes(w)),
        selected: new Set(),
        over: s.solved.length + 1 === 4,
      }));
      setAnnouncement(`"${match.label}" gefunden.`);
    } else {
      sfx.error();
      vibrate([120, 60, 80]);
      setState((s) => {
        const m = s.mistakes + 1;
        if (m >= MAX_MISTAKES) {
          const remaining = puzzle.groups.filter((g) => !s.solved.includes(g));
          return {
            ...s,
            mistakes: m,
            selected: new Set(),
            solved: [...s.solved, ...remaining],
            remaining: [],
            over: true,
          };
        }
        return { ...s, mistakes: m, selected: new Set() };
      });
      setAnnouncement(
        state.mistakes + 1 >= MAX_MISTAKES
          ? 'Leider verloren. Hier die Lösung.'
          : `Falsch. Noch ${MAX_MISTAKES - state.mistakes - 1} Versuche.`,
      );
    }
  }, [state.puzzleIndex, state.selected, state.solved, state.over, state.mistakes, sfx, vibrate]);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      {state.solved.length > 0 && (
        <div
          className="flex w-full max-w-md flex-col gap-2"
          role="group"
          aria-label="Gelöste Gruppen"
        >
          {state.solved.map((g) => (
            <div
              key={g.label}
              className={`rounded-xl p-3 text-center text-white ${g.bg}`}
              role="group"
              aria-label={g.label}
            >
              <div className="text-xs font-medium opacity-90">{g.label}</div>
              <div className="font-bold">{g.words.join(', ')}</div>
            </div>
          ))}
        </div>
      )}

      <div
        className="grid w-full max-w-md grid-cols-4 gap-2"
        role="group"
        aria-label="Connections-Wortgitter"
      >
        {state.remaining.map((word) => {
          const isSelected = state.selected.has(word);
          return (
            <button
              key={word}
              type="button"
              onClick={() => toggleWord(word)}
              disabled={state.over}
              aria-pressed={isSelected}
              className={`min-h-14 rounded-xl border-2 px-1 text-xs font-bold leading-tight transition disabled:cursor-not-allowed sm:text-sm ${
                isSelected
                  ? 'border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-300 dark:bg-amber-900/30 dark:text-amber-100'
                  : 'border-surface-300 bg-surface-100 text-surface-900 hover:border-amber-400 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100'
              }`}
            >
              {word}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2" role="status" aria-label="Verbleibende Versuche">
        {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className={`block h-3 w-3 rounded-full ${
              i < state.mistakes ? 'bg-surface-400 dark:bg-surface-700' : 'bg-rose-500'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="ghost" size="sm" onClick={clearSelection}>
          Auswahl löschen
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={submit}
          disabled={state.selected.size !== GROUP_SIZE || state.over}
        >
          Prüfen
        </Button>
        <Button variant="secondary" size="sm" onClick={restart}>
          Neues Rätsel
        </Button>
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Wähle 4 Wörter, die zu einer Gruppe gehören. Bei 4 Fehlern ist das Spiel vorbei.
      </p>
    </div>
  );
}
