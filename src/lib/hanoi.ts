export interface HanoiState {
  pegs: number[][];
  disks: number;
  moves: number;
  selected: number | null;
}

export function createInitialState(disks: number): HanoiState {
  const first: number[] = [];
  for (let i = disks; i >= 1; i--) first.push(i);
  return { pegs: [first, [], []], disks, moves: 0, selected: null };
}

export function tryMove(state: HanoiState, from: number, to: number): HanoiState {
  if (from === to) return state;
  const src = state.pegs[from];
  const dst = state.pegs[to];
  if (!src || !dst) return state;
  const top = src[src.length - 1];
  if (top === undefined) return state;
  const dstTop = dst[dst.length - 1];
  if (dstTop !== undefined && top > dstTop) return state;
  const pegs = state.pegs.map((p) => p.slice());
  pegs[from]!.pop();
  pegs[to]!.push(top);
  return { ...state, pegs, moves: state.moves + 1, selected: null };
}

export function selectPeg(state: HanoiState, peg: number): HanoiState {
  if (state.selected === null) {
    const src = state.pegs[peg];
    if (!src || src.length === 0) return state;
    return { ...state, selected: peg };
  }
  if (state.selected === peg) return { ...state, selected: null };
  return tryMove(state, state.selected, peg);
}

export function isSolved(state: HanoiState): boolean {
  return state.pegs[2]!.length === state.disks;
}

export function minimumMoves(disks: number): number {
  return (1 << disks) - 1;
}
