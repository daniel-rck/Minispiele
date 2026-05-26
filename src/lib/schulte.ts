export const SCHULTE_SIZES = [3, 4, 5, 6, 7] as const;
export type SchulteSize = (typeof SCHULTE_SIZES)[number];

export function shuffled(n: number, rng: () => number = Math.random): number[] {
  const arr = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export interface SchulteState {
  board: number[];
  next: number;
  total: number;
  done: boolean;
}

export function createInitialState(size: number, rng: () => number = Math.random): SchulteState {
  const total = size * size;
  return { board: shuffled(total, rng), next: 1, total, done: false };
}

export function pressNumber(state: SchulteState, value: number): SchulteState {
  if (state.done) return state;
  if (value !== state.next) return state;
  const next = state.next + 1;
  return { ...state, next, done: value === state.total };
}

export function isComplete(state: SchulteState): boolean {
  return state.done;
}
