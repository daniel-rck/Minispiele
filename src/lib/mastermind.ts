export const COLORS = 6;
export const CODE_LENGTH = 4;
export const MAX_GUESSES = 10;

export interface Feedback {
  black: number;
  white: number;
}

export interface MastermindState {
  code: number[];
  guesses: number[][];
  feedback: Feedback[];
  current: number[];
  done: 'won' | 'lost' | null;
}

export function generateCode(rng: () => number = Math.random): number[] {
  const code: number[] = [];
  for (let i = 0; i < CODE_LENGTH; i++) {
    code.push(Math.floor(rng() * COLORS));
  }
  return code;
}

export function evaluateGuess(code: number[], guess: number[]): Feedback {
  let black = 0;
  const codeRem: number[] = [];
  const guessRem: number[] = [];
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guess[i] === code[i]) black++;
    else {
      codeRem.push(code[i]!);
      guessRem.push(guess[i]!);
    }
  }
  let white = 0;
  for (const g of guessRem) {
    const idx = codeRem.indexOf(g);
    if (idx !== -1) {
      white++;
      codeRem.splice(idx, 1);
    }
  }
  return { black, white };
}

export function createInitialState(rng: () => number = Math.random): MastermindState {
  return {
    code: generateCode(rng),
    guesses: [],
    feedback: [],
    current: [],
    done: null,
  };
}

export function placePeg(state: MastermindState, color: number): MastermindState {
  if (state.done) return state;
  if (state.current.length >= CODE_LENGTH) return state;
  return { ...state, current: [...state.current, color] };
}

export function removePeg(state: MastermindState): MastermindState {
  if (state.done) return state;
  if (state.current.length === 0) return state;
  return { ...state, current: state.current.slice(0, -1) };
}

export function submit(state: MastermindState): MastermindState {
  if (state.done) return state;
  if (state.current.length !== CODE_LENGTH) return state;
  const guess = state.current.slice();
  const fb = evaluateGuess(state.code, guess);
  const guesses = [...state.guesses, guess];
  const feedback = [...state.feedback, fb];
  let done: MastermindState['done'] = null;
  if (fb.black === CODE_LENGTH) done = 'won';
  else if (guesses.length >= MAX_GUESSES) done = 'lost';
  return { ...state, guesses, feedback, current: [], done };
}
