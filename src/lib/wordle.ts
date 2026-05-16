import { SOLUTIONS, VALID_GUESSES } from './wordleWords';

export type LetterState = 'correct' | 'present' | 'absent';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export interface WordleState {
  target: string;
  guesses: string[];
  statuses: LetterState[][];
  current: string;
  done: 'won' | 'lost' | null;
}

export function createInitialState(target: string): WordleState {
  return {
    target: target.toUpperCase(),
    guesses: [],
    statuses: [],
    current: '',
    done: null,
  };
}

export function pickRandomWord(rng: () => number = Math.random): string {
  const idx = Math.min(SOLUTIONS.length - 1, Math.max(0, Math.floor(rng() * SOLUTIONS.length)));
  return SOLUTIONS[idx]!.toUpperCase();
}

export function isValidWord(word: string): boolean {
  if (word.length !== WORD_LENGTH) return false;
  const upper = word.toUpperCase();
  return VALID_GUESSES.has(upper) || SOLUTIONS.includes(upper);
}

export function scoreGuess(guess: string, target: string): LetterState[] {
  const g = guess.toUpperCase();
  const t = target.toUpperCase();
  if (g.length !== t.length) {
    throw new Error('scoreGuess: length mismatch');
  }
  const result: LetterState[] = new Array(g.length).fill('absent');
  const remaining: Record<string, number> = {};

  for (let i = 0; i < t.length; i++) {
    if (g[i] === t[i]) {
      result[i] = 'correct';
    } else {
      const ch = t[i]!;
      remaining[ch] = (remaining[ch] ?? 0) + 1;
    }
  }
  for (let i = 0; i < g.length; i++) {
    if (result[i] === 'correct') continue;
    const ch = g[i]!;
    if ((remaining[ch] ?? 0) > 0) {
      result[i] = 'present';
      remaining[ch] = remaining[ch]! - 1;
    }
  }
  return result;
}

export interface SubmitResult {
  state: WordleState;
  error?: 'too-short' | 'not-a-word' | 'finished';
}

export function submitGuess(state: WordleState, raw: string): SubmitResult {
  if (state.done) return { state, error: 'finished' };
  const guess = raw.toUpperCase();
  if (guess.length !== WORD_LENGTH) return { state, error: 'too-short' };
  if (!isValidWord(guess)) return { state, error: 'not-a-word' };

  const status = scoreGuess(guess, state.target);
  const guesses = [...state.guesses, guess];
  const statuses = [...state.statuses, status];
  const won = status.every((s) => s === 'correct');
  const lost = !won && guesses.length >= MAX_GUESSES;
  return {
    state: {
      ...state,
      guesses,
      statuses,
      current: '',
      done: won ? 'won' : lost ? 'lost' : null,
    },
  };
}

export function appendLetter(state: WordleState, letter: string): WordleState {
  if (state.done) return state;
  if (state.current.length >= WORD_LENGTH) return state;
  const ch = letter.toUpperCase();
  if (!/^[A-ZÄÖÜẞ]$/.test(ch)) return state;
  return { ...state, current: state.current + ch };
}

export function backspace(state: WordleState): WordleState {
  if (state.done) return state;
  if (state.current.length === 0) return state;
  return { ...state, current: state.current.slice(0, -1) };
}

/**
 * Aggregates per-letter status across all previous guesses. Used for keyboard hints.
 * Precedence: correct > present > absent.
 */
export function keyboardStatus(state: WordleState): Record<string, LetterState> {
  const map: Record<string, LetterState> = {};
  state.guesses.forEach((guess, idx) => {
    const statuses = state.statuses[idx];
    if (!statuses) return;
    for (let i = 0; i < guess.length; i++) {
      const ch = guess[i]!;
      const next = statuses[i]!;
      const prev = map[ch];
      if (!prev) {
        map[ch] = next;
      } else if (prev === 'absent' && next !== 'absent') {
        map[ch] = next;
      } else if (prev === 'present' && next === 'correct') {
        map[ch] = 'correct';
      }
    }
  });
  return map;
}
