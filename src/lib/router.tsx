import type { ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from './routes.ts';

const rel = (path: string) => (path.startsWith('/') ? path.slice(1) : path);

// After a deploy, the cached `index.html` in a user's tab may reference
// chunk hashes that no longer exist on the CDN. A lazy() dynamic import
// then fails with TypeError. Reload once per ~30 s window to fetch the
// fresh `index.html` (and the matching chunk hashes); the TTL guards
// against reload loops if the failure is not just stale-chunk.
const CHUNK_RELOAD_KEY = '__chunkReloadedAt';
const CHUNK_RELOAD_TTL_MS = 30_000;

function isChunkLoadError(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false;
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    err.message,
  );
}

async function tryImport<T>(importer: () => Promise<T>): Promise<T> {
  try {
    return await importer();
  } catch (err) {
    if (isChunkLoadError(err) && typeof window !== 'undefined') {
      const last = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY)) || 0;
      if (Date.now() - last > CHUNK_RELOAD_TTL_MS) {
        window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
        window.location.reload();
      }
    }
    throw err;
  }
}

const lazyPage = (importer: () => Promise<{ default: ComponentType }>) => async () => {
  const mod = await tryImport(importer);
  return { Component: mod.default };
};

export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    lazy: lazyPage(() => import('../components/AppShellRoute.tsx')),
    children: [
      { index: true, lazy: lazyPage(() => import('../pages/Home.tsx')) },
      { path: rel(ROUTES.ringSort), lazy: lazyPage(() => import('../pages/RingSort.tsx')) },
      { path: rel(ROUTES.timer), lazy: lazyPage(() => import('../pages/Timer.tsx')) },
      { path: rel(ROUTES.dice), lazy: lazyPage(() => import('../pages/Dice.tsx')) },
      { path: rel(ROUTES.memory), lazy: lazyPage(() => import('../pages/Memory.tsx')) },
      {
        path: rel(ROUTES.twentyFortyEight),
        lazy: lazyPage(() => import('../pages/TwentyFortyEight.tsx')),
      },
      {
        path: rel(ROUTES.slidingPuzzle),
        lazy: lazyPage(() => import('../pages/SlidingPuzzle.tsx')),
      },
      { path: rel(ROUTES.simon), lazy: lazyPage(() => import('../pages/Simon.tsx')) },
      {
        path: rel(ROUTES.minesweeper),
        lazy: lazyPage(() => import('../pages/Minesweeper.tsx')),
      },
      { path: rel(ROUTES.snake), lazy: lazyPage(() => import('../pages/Snake.tsx')) },
      { path: rel(ROUTES.wordle), lazy: lazyPage(() => import('../pages/Wordle.tsx')) },
      { path: rel(ROUTES.reaction), lazy: lazyPage(() => import('../pages/Reaction.tsx')) },
      { path: rel(ROUTES.stroop), lazy: lazyPage(() => import('../pages/Stroop.tsx')) },
      { path: rel(ROUTES.schulte), lazy: lazyPage(() => import('../pages/Schulte.tsx')) },
      { path: rel(ROUTES.hanoi), lazy: lazyPage(() => import('../pages/Hanoi.tsx')) },
      {
        path: rel(ROUTES.lightsOut),
        lazy: lazyPage(() => import('../pages/LightsOut.tsx')),
      },
      {
        path: rel(ROUTES.mastermind),
        lazy: lazyPage(() => import('../pages/Mastermind.tsx')),
      },
      { path: rel(ROUTES.hangman), lazy: lazyPage(() => import('../pages/Hangman.tsx')) },
      { path: rel(ROUTES.anagram), lazy: lazyPage(() => import('../pages/Anagram.tsx')) },
      { path: rel(ROUTES.sudoku), lazy: lazyPage(() => import('../pages/Sudoku.tsx')) },
      { path: rel(ROUTES.nonogram), lazy: lazyPage(() => import('../pages/Nonogram.tsx')) },
      { path: rel(ROUTES.sokoban), lazy: lazyPage(() => import('../pages/Sokoban.tsx')) },
      {
        path: rel(ROUTES.wordsearch),
        lazy: lazyPage(() => import('../pages/Wordsearch.tsx')),
      },
      { path: rel(ROUTES.breakout), lazy: lazyPage(() => import('../pages/Breakout.tsx')) },
      { path: rel(ROUTES.bubbles), lazy: lazyPage(() => import('../pages/Bubbles.tsx')) },
      { path: rel(ROUTES.blocks), lazy: lazyPage(() => import('../pages/Blocks.tsx')) },
      { path: rel(ROUTES.freecell), lazy: lazyPage(() => import('../pages/Freecell.tsx')) },
      { path: rel(ROUTES.tangram), lazy: lazyPage(() => import('../pages/Tangram.tsx')) },
      { path: rel(ROUTES.flow), lazy: lazyPage(() => import('../pages/Flow.tsx')) },
      {
        path: rel(ROUTES.trafficJam),
        lazy: lazyPage(() => import('../pages/TrafficJam.tsx')),
      },
      {
        path: rel(ROUTES.hyperfokus),
        lazy: lazyPage(() => import('../pages/Hyperfokus.tsx')),
      },
      { path: rel(ROUTES.gfrett), lazy: lazyPage(() => import('../pages/Gfrett.tsx')) },
      {
        path: rel(ROUTES.colorFlood),
        lazy: lazyPage(() => import('../pages/ColorFlood.tsx')),
      },
      {
        path: rel(ROUTES.spellingBee),
        lazy: lazyPage(() => import('../pages/SpellingBee.tsx')),
      },
      { path: rel(ROUTES.bingo), lazy: lazyPage(() => import('../pages/Bingo.tsx')) },
      {
        path: rel(ROUTES.slotMachine),
        lazy: lazyPage(() => import('../pages/SlotMachine.tsx')),
      },
      {
        path: rel(ROUTES.idleClicker),
        lazy: lazyPage(() => import('../pages/IdleClicker.tsx')),
      },
      {
        path: rel(ROUTES.leiterspiel),
        lazy: lazyPage(() => import('../pages/Ladders.tsx')),
      },
      {
        path: rel(ROUTES.ticTacToe),
        lazy: lazyPage(() => import('../pages/TicTacToe.tsx')),
      },
      {
        path: rel(ROUTES.asteroids),
        lazy: lazyPage(() => import('../pages/Asteroids.tsx')),
      },
      {
        path: rel(ROUTES.binairo),
        lazy: lazyPage(() => import('../pages/Binairo.tsx')),
      },
      {
        path: rel(ROUTES.columns),
        lazy: lazyPage(() => import('../pages/Columns.tsx')),
      },
      {
        path: rel(ROUTES.connections),
        lazy: lazyPage(() => import('../pages/Connections.tsx')),
      },
      {
        path: rel(ROUTES.conwayBattle),
        lazy: lazyPage(() => import('../pages/ConwayBattle.tsx')),
      },
      {
        path: rel(ROUTES.doodleJump),
        lazy: lazyPage(() => import('../pages/DoodleJump.tsx')),
      },
      {
        path: rel(ROUTES.flappyBird),
        lazy: lazyPage(() => import('../pages/FlappyBird.tsx')),
      },
      {
        path: rel(ROUTES.frogger),
        lazy: lazyPage(() => import('../pages/Frogger.tsx')),
      },
      {
        path: rel(ROUTES.futoshiki),
        lazy: lazyPage(() => import('../pages/Futoshiki.tsx')),
      },
      {
        path: rel(ROUTES.gameOfLife),
        lazy: lazyPage(() => import('../pages/GameOfLife.tsx')),
      },
      {
        path: rel(ROUTES.halma),
        lazy: lazyPage(() => import('../pages/Halma.tsx')),
      },
      {
        path: rel(ROUTES.helicopter),
        lazy: lazyPage(() => import('../pages/Helicopter.tsx')),
      },
      {
        path: rel(ROUTES.hitori),
        lazy: lazyPage(() => import('../pages/Hitori.tsx')),
      },
      {
        path: rel(ROUTES.kakuro),
        lazy: lazyPage(() => import('../pages/Kakuro.tsx')),
      },
      {
        path: rel(ROUTES.kniffel),
        lazy: lazyPage(() => import('../pages/Kniffel.tsx')),
      },
      {
        path: rel(ROUTES.crossword),
        lazy: lazyPage(() => import('../pages/Crossword.tsx')),
      },
      {
        path: rel(ROUTES.match3),
        lazy: lazyPage(() => import('../pages/Match3.tsx')),
      },
      {
        path: rel(ROUTES.minesweeperHex),
        lazy: lazyPage(() => import('../pages/MinesweeperHex.tsx')),
      },
      {
        path: rel(ROUTES.nurikabe),
        lazy: lazyPage(() => import('../pages/Nurikabe.tsx')),
      },
      {
        path: rel(ROUTES.pentomino),
        lazy: lazyPage(() => import('../pages/Pentomino.tsx')),
      },
      {
        path: rel(ROUTES.pipePuzzle),
        lazy: lazyPage(() => import('../pages/PipePuzzle.tsx')),
      },
      {
        path: rel(ROUTES.pong),
        lazy: lazyPage(() => import('../pages/Pong.tsx')),
      },
      {
        path: rel(ROUTES.quiz),
        lazy: lazyPage(() => import('../pages/Quiz.tsx')),
      },
      {
        path: rel(ROUTES.qwirkle),
        lazy: lazyPage(() => import('../pages/Qwirkle.tsx')),
      },
      {
        path: rel(ROUTES.roulette),
        lazy: lazyPage(() => import('../pages/Roulette.tsx')),
      },
    ],
  },
]);
