export type RingColor = 'red' | 'blue' | 'green';

export interface Ring {
  color: RingColor;
  size: number;
  id: string;
}

export type Peg = Ring[];
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  pegs: Peg[];
  selectedPegIndex: number | null;
  moves: number;
  won: boolean;
  difficulty: Difficulty;
  allowColorMix: boolean;
}

export const NUM_PEGS = 4;
export const COLORS: readonly RingColor[] = ['red', 'blue', 'green'] as const;

export const RINGS_PER_COLOR: Record<Difficulty, number> = {
  easy: 3,
  medium: 4,
  hard: 5,
};

export function pegCapacity(difficulty: Difficulty): number {
  return RINGS_PER_COLOR[difficulty];
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

export function createInitialState(
  difficulty: Difficulty,
  allowColorMix: boolean = false,
  seed: number = Date.now(),
): GameState {
  const ringsPerColor = RINGS_PER_COLOR[difficulty];
  const rng = mulberry32(seed);

  const bag: Ring[] = [];
  for (const color of COLORS) {
    for (let size = 0; size < ringsPerColor; size++) {
      bag.push({ color, size, id: `${color}-${size}` });
    }
  }
  const shuffled = shuffle(bag, rng);

  const filledPegs = NUM_PEGS - 1;
  const pegs: Peg[] = Array.from({ length: NUM_PEGS }, () => [] as Peg);
  shuffled.forEach((ring, i) => {
    const target = pegs[i % filledPegs];
    if (target) target.push(ring);
  });

  return {
    pegs,
    selectedPegIndex: null,
    moves: 0,
    won: isSolved(pegs),
    difficulty,
    allowColorMix,
  };
}

export function isSolved(pegs: Peg[]): boolean {
  const seenColors = new Set<RingColor>();
  for (const peg of pegs) {
    const head = peg[0];
    if (!head) continue;
    const first = head.color;
    if (!peg.every((r) => r.color === first)) return false;
    if (seenColors.has(first)) return false;
    seenColors.add(first);
  }
  return true;
}

export function selectPeg(state: GameState, pegIndex: number): GameState {
  if (state.won) return state;
  const peg = state.pegs[pegIndex];
  if (!peg || peg.length === 0) return state;
  return { ...state, selectedPegIndex: pegIndex };
}

export function clearSelection(state: GameState): GameState {
  if (state.selectedPegIndex === null) return state;
  return { ...state, selectedPegIndex: null };
}

export function canMove(
  pegs: Peg[],
  from: number,
  to: number,
  difficulty: Difficulty,
  allowColorMix: boolean,
): boolean {
  if (from === to) return false;
  const src = pegs[from];
  const dst = pegs[to];
  if (!src || !dst) return false;
  if (src.length === 0) return false;
  if (dst.length >= pegCapacity(difficulty)) return false;
  if (dst.length === 0) return true;
  if (allowColorMix) return true;
  const dstTop = dst[dst.length - 1];
  const srcTop = src[src.length - 1];
  if (!dstTop || !srcTop) return false;
  return dstTop.color === srcTop.color;
}

export function tryMove(state: GameState, from: number, to: number): GameState {
  if (state.won) return state;
  if (!canMove(state.pegs, from, to, state.difficulty, state.allowColorMix)) {
    return { ...state, selectedPegIndex: null };
  }
  const pegs = state.pegs.map((p) => p.slice());
  const src = pegs[from];
  const dst = pegs[to];
  if (!src || !dst) return { ...state, selectedPegIndex: null };
  const ring = src.pop();
  if (ring === undefined) return { ...state, selectedPegIndex: null };
  dst.push(ring);
  return {
    ...state,
    pegs,
    selectedPegIndex: null,
    moves: state.moves + 1,
    won: isSolved(pegs),
  };
}
