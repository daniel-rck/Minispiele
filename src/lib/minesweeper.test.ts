import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  DIFFICULTY,
  HEX_DIFFICULTY,
  type MinesweeperState,
  neighborIndices,
  placeMinesAvoiding,
  reveal,
  toggleFlag,
} from './minesweeper';

function constRng(value = 0): () => number {
  return () => value;
}

describe('minesweeper', () => {
  it('createInitialState produces an empty grid with the expected size', () => {
    const s = createInitialState('easy');
    expect(s.cols).toBe(DIFFICULTY.easy.cols);
    expect(s.rows).toBe(DIFFICULTY.easy.rows);
    expect(s.mines).toBe(DIFFICULTY.easy.mines);
    expect(s.grid).toHaveLength(s.cols * s.rows);
    expect(s.grid.every((c) => !c.mine && !c.revealed && !c.flagged)).toBe(true);
    expect(s.firstClick).toBe(true);
  });

  it('placeMinesAvoiding places the configured number of mines and skips the safe area', () => {
    const s = createInitialState('easy');
    // With constant rng → Fisher-Yates is a no-op, so mines fill the lowest indices
    // outside the safe area around idx 0 (which forbids 0, 1, cols, cols+1).
    const after = placeMinesAvoiding(s, 0, constRng(0));
    const mineCount = after.grid.filter((c) => c.mine).length;
    expect(mineCount).toBe(s.mines);
    // The clicked cell and its neighbours must not be mines.
    expect(after.grid[0]!.mine).toBe(false);
    expect(after.grid[1]!.mine).toBe(false);
    expect(after.grid[s.cols]!.mine).toBe(false);
    expect(after.grid[s.cols + 1]!.mine).toBe(false);
    expect(after.firstClick).toBe(false);
  });

  it('placeMinesAvoiding computes correct adjacent counts', () => {
    const s = createInitialState('easy');
    const after = placeMinesAvoiding(s, 0, constRng(0));
    // For every non-mine cell, the adjacent count must equal the actual neighbour mine count.
    for (let i = 0; i < after.grid.length; i++) {
      if (after.grid[i]!.mine) continue;
      const x = i % after.cols;
      const y = Math.floor(i / after.cols);
      let real = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < after.cols && ny >= 0 && ny < after.rows) {
            if (after.grid[ny * after.cols + nx]!.mine) real += 1;
          }
        }
      }
      expect(after.grid[i]!.adjacent).toBe(real);
    }
  });

  it('reveal places mines on first click avoiding the clicked cell', () => {
    const s = createInitialState('easy');
    const after = reveal(s, 0, constRng(0));
    expect(after.firstClick).toBe(false);
    expect(after.grid[0]!.revealed).toBe(true);
    expect(after.grid[0]!.mine).toBe(false);
    expect(after.lost).toBe(false);
  });

  it('reveal cascades through 0-adjacent neighbors', () => {
    const s = createInitialState('easy');
    const after = reveal(s, 0, constRng(0));
    // The clicked cell has adjacent=0 (it has no mines around it), so flood-fill
    // should reveal more than one cell.
    expect(after.revealed).toBeGreaterThan(1);
  });

  it('reveal on a mine ends the game with lost=true and losingIdx set', () => {
    const s = createInitialState('easy');
    const seeded = placeMinesAvoiding(s, 0, constRng(0));
    const mineIdx = seeded.grid.findIndex((c) => c.mine);
    expect(mineIdx).toBeGreaterThan(-1);
    const after = reveal({ ...seeded, firstClick: false }, mineIdx);
    expect(after.lost).toBe(true);
    expect(after.losingIdx).toBe(mineIdx);
    expect(after.grid[mineIdx]!.revealed).toBe(true);
  });

  it('reveal on a flagged cell is a no-op', () => {
    const s = createInitialState('easy');
    const flagged = toggleFlag(s, 5);
    const after = reveal(flagged, 5);
    expect(after).toBe(flagged);
  });

  it('toggleFlag flips the flag and updates the counter', () => {
    const s = createInitialState('easy');
    const a = toggleFlag(s, 3);
    expect(a.grid[3]!.flagged).toBe(true);
    expect(a.flagged).toBe(1);
    const b = toggleFlag(a, 3);
    expect(b.grid[3]!.flagged).toBe(false);
    expect(b.flagged).toBe(0);
  });

  it('toggleFlag on a revealed cell is a no-op', () => {
    const s = createInitialState('easy');
    const revealed = reveal(s, 0, constRng(0));
    const firstRevealedIdx = revealed.grid.findIndex((c) => c.revealed);
    const after = toggleFlag(revealed, firstRevealedIdx);
    expect(after).toBe(revealed);
  });

  it('reveals to a win when all non-mine cells are uncovered', () => {
    // Tiny synthetic state: 3x3 with one mine at index 8.
    const grid = Array.from({ length: 9 }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    }));
    grid[8]!.mine = true;
    grid[4]!.adjacent = 1;
    grid[5]!.adjacent = 1;
    grid[7]!.adjacent = 1;
    const state = {
      grid,
      cols: 3,
      rows: 3,
      mines: 1,
      revealed: 0,
      flagged: 0,
      lost: false,
      won: false,
      firstClick: false,
      difficulty: 'easy' as const,
      mode: 'rect' as const,
      losingIdx: null,
    };
    const after = reveal(state, 0);
    expect(after.won).toBe(true);
    expect(after.revealed).toBe(8);
  });

  it('createInitialState supports hex mode with hex difficulty configs', () => {
    const s = createInitialState('easy', 'hex');
    expect(s.mode).toBe('hex');
    expect(s.cols).toBe(HEX_DIFFICULTY.easy.cols);
    expect(s.rows).toBe(HEX_DIFFICULTY.easy.rows);
    expect(s.mines).toBe(HEX_DIFFICULTY.easy.mines);
  });

  it('neighborIndices returns 6 neighbors for an interior hex cell on an even row', () => {
    // idx 12 in a 5×5 grid = (r=2, c=2, even row).
    // Even-row hex dirs: (-1,-1)=6, (-1,0)=7, (0,-1)=11, (0,1)=13, (1,-1)=16, (1,0)=17.
    const n = neighborIndices(12, 5, 5, 'hex')
      .slice()
      .sort((a, b) => a - b);
    expect(n).toEqual([6, 7, 11, 13, 16, 17]);
  });

  it('neighborIndices returns 6 neighbors for an interior hex cell on an odd row', () => {
    // idx 17 in a 5×5 grid = (r=3, c=2, odd row).
    // Odd-row hex dirs: (-1,0)=12, (-1,1)=13, (0,-1)=16, (0,1)=18, (1,0)=22, (1,1)=23.
    const n = neighborIndices(17, 5, 5, 'hex')
      .slice()
      .sort((a, b) => a - b);
    expect(n).toEqual([12, 13, 16, 18, 22, 23]);
  });

  it('neighborIndices differs between rect (8 neighbors) and hex (6 neighbors) for the same cell', () => {
    const rect = new Set(neighborIndices(12, 5, 5, 'rect'));
    const hex = new Set(neighborIndices(12, 5, 5, 'hex'));
    expect(rect.size).toBe(8);
    expect(hex.size).toBe(6);
    // Cells 8 (r=1,c=3) and 18 (r=3,c=3) are rect neighbors of idx 12 but not hex neighbors.
    expect(rect.has(8)).toBe(true);
    expect(rect.has(18)).toBe(true);
    expect(hex.has(8)).toBe(false);
    expect(hex.has(18)).toBe(false);
  });

  it('neighborIndices clips to bounds for hex corner cells', () => {
    // idx 0 = (r=0, c=0, even row). Only (0,1)=1 and (1,0)=5 are inside.
    expect(
      neighborIndices(0, 5, 5, 'hex')
        .slice()
        .sort((a, b) => a - b),
    ).toEqual([1, 5]);
  });

  it('reveal cascade respects hex 6-neighbor topology', () => {
    // Build a synthetic 5×5 hex state with one mine at idx 12 (r=2,c=2, even row).
    // Its hex neighbors {6,7,11,13,16,17} get adjacent=1; all other non-mine cells stay 0.
    // In rect topology, idx 8 (r=1,c=3) and idx 18 (r=3,c=3) would also be adjacent to the mine.
    // So in hex mode the cascade from corner idx 0 must reach 8 and 18 (adjacent=0),
    // proving the cascade uses hex neighbours instead of rect.
    const grid = Array.from({ length: 25 }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    }));
    grid[12]!.mine = true;
    for (const i of [6, 7, 11, 13, 16, 17]) grid[i]!.adjacent = 1;
    const state: MinesweeperState = {
      grid,
      cols: 5,
      rows: 5,
      mines: 1,
      revealed: 0,
      flagged: 0,
      lost: false,
      won: false,
      firstClick: false,
      difficulty: 'easy',
      mode: 'hex',
      losingIdx: null,
    };

    const after = reveal(state, 0);
    // Cells 8 and 18 are rect-neighbours of the mine but NOT hex-neighbours → cascade reaches them.
    expect(after.grid[8]!.revealed).toBe(true);
    expect(after.grid[18]!.revealed).toBe(true);
    // Hex boundary cells (adjacent=1) are revealed but cascade stops there.
    expect(after.grid[6]!.revealed).toBe(true);
    expect(after.grid[7]!.revealed).toBe(true);
    expect(after.grid[11]!.revealed).toBe(true);
    expect(after.grid[13]!.revealed).toBe(true);
    expect(after.grid[16]!.revealed).toBe(true);
    expect(after.grid[17]!.revealed).toBe(true);
    // Mine itself never revealed by cascade.
    expect(after.grid[12]!.revealed).toBe(false);
  });

  it('createInitialState hex easy uses HEX_DIFFICULTY dimensions', () => {
    // Sanity: easy hex grid is 8×8 (not 9×9 like rect).
    const s = createInitialState('easy', 'hex');
    expect(s.cols).toBe(HEX_DIFFICULTY.easy.cols);
    expect(s.rows).toBe(HEX_DIFFICULTY.easy.rows);
    expect(s.cols).toBe(8);
    expect(s.rows).toBe(8);
  });
});
