export type SimonColor = 0 | 1 | 2 | 3;
export type SimonPhase = 'idle' | 'showing' | 'input' | 'lost';

export interface SimonState {
  sequence: SimonColor[];
  inputIdx: number;
  phase: SimonPhase;
  level: number;
}

export function createInitialState(): SimonState {
  return { sequence: [], inputIdx: 0, phase: 'idle', level: 0 };
}

export function extendSequence(state: SimonState, rng: () => number = Math.random): SimonState {
  const next = Math.min(3, Math.max(0, Math.floor(rng() * 4))) as SimonColor;
  return {
    sequence: [...state.sequence, next],
    inputIdx: 0,
    phase: 'showing',
    level: state.level + 1,
  };
}

export function startInput(state: SimonState): SimonState {
  return { ...state, phase: 'input', inputIdx: 0 };
}

export interface PressResult {
  state: SimonState;
  correct: boolean;
  /** True when this press completes the current round (all colors matched). */
  completed: boolean;
}

export function pressColor(state: SimonState, color: SimonColor): PressResult {
  if (state.phase !== 'input') {
    return { state, correct: false, completed: false };
  }
  const expected = state.sequence[state.inputIdx];
  if (color !== expected) {
    return {
      state: { ...state, phase: 'lost' },
      correct: false,
      completed: false,
    };
  }
  const nextIdx = state.inputIdx + 1;
  const completed = nextIdx >= state.sequence.length;
  return {
    state: { ...state, inputIdx: nextIdx },
    correct: true,
    completed,
  };
}

export function flashDurationMs(level: number, base = 600, min = 250, step = 30): number {
  return Math.max(min, base - (level - 1) * step);
}
