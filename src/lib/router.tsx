import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from './routes.ts';

const rel = (path: string) => (path.startsWith('/') ? path.slice(1) : path);

export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    lazy: async () => {
      const mod = await import('../components/AppShellRoute.tsx');
      return { Component: mod.default };
    },
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('../pages/Home.tsx')).default }),
      },
      {
        path: rel(ROUTES.ringSort),
        lazy: async () => ({ Component: (await import('../pages/RingSort.tsx')).default }),
      },
      {
        path: rel(ROUTES.timer),
        lazy: async () => ({ Component: (await import('../pages/Timer.tsx')).default }),
      },
      {
        path: rel(ROUTES.dice),
        lazy: async () => ({ Component: (await import('../pages/Dice.tsx')).default }),
      },
      {
        path: rel(ROUTES.memory),
        lazy: async () => ({ Component: (await import('../pages/Memory.tsx')).default }),
      },
      {
        path: rel(ROUTES.twentyFortyEight),
        lazy: async () => ({
          Component: (await import('../pages/TwentyFortyEight.tsx')).default,
        }),
      },
      {
        path: rel(ROUTES.slidingPuzzle),
        lazy: async () => ({
          Component: (await import('../pages/SlidingPuzzle.tsx')).default,
        }),
      },
      {
        path: rel(ROUTES.simon),
        lazy: async () => ({ Component: (await import('../pages/Simon.tsx')).default }),
      },
      {
        path: rel(ROUTES.minesweeper),
        lazy: async () => ({ Component: (await import('../pages/Minesweeper.tsx')).default }),
      },
      {
        path: rel(ROUTES.snake),
        lazy: async () => ({ Component: (await import('../pages/Snake.tsx')).default }),
      },
      {
        path: rel(ROUTES.wordle),
        lazy: async () => ({ Component: (await import('../pages/Wordle.tsx')).default }),
      },
      {
        path: rel(ROUTES.reaction),
        lazy: async () => ({ Component: (await import('../pages/Reaction.tsx')).default }),
      },
      {
        path: rel(ROUTES.stroop),
        lazy: async () => ({ Component: (await import('../pages/Stroop.tsx')).default }),
      },
      {
        path: rel(ROUTES.schulte),
        lazy: async () => ({ Component: (await import('../pages/Schulte.tsx')).default }),
      },
      {
        path: rel(ROUTES.hanoi),
        lazy: async () => ({ Component: (await import('../pages/Hanoi.tsx')).default }),
      },
      {
        path: rel(ROUTES.lightsOut),
        lazy: async () => ({ Component: (await import('../pages/LightsOut.tsx')).default }),
      },
      {
        path: rel(ROUTES.mastermind),
        lazy: async () => ({ Component: (await import('../pages/Mastermind.tsx')).default }),
      },
      {
        path: rel(ROUTES.hangman),
        lazy: async () => ({ Component: (await import('../pages/Hangman.tsx')).default }),
      },
      {
        path: rel(ROUTES.anagram),
        lazy: async () => ({ Component: (await import('../pages/Anagram.tsx')).default }),
      },
      {
        path: rel(ROUTES.sudoku),
        lazy: async () => ({ Component: (await import('../pages/Sudoku.tsx')).default }),
      },
      {
        path: rel(ROUTES.nonogram),
        lazy: async () => ({ Component: (await import('../pages/Nonogram.tsx')).default }),
      },
      {
        path: rel(ROUTES.sokoban),
        lazy: async () => ({ Component: (await import('../pages/Sokoban.tsx')).default }),
      },
      {
        path: rel(ROUTES.wordsearch),
        lazy: async () => ({ Component: (await import('../pages/Wordsearch.tsx')).default }),
      },
      {
        path: rel(ROUTES.breakout),
        lazy: async () => ({ Component: (await import('../pages/Breakout.tsx')).default }),
      },
      {
        path: rel(ROUTES.bubbles),
        lazy: async () => ({ Component: (await import('../pages/Bubbles.tsx')).default }),
      },
      {
        path: rel(ROUTES.blocks),
        lazy: async () => ({ Component: (await import('../pages/Blocks.tsx')).default }),
      },
      {
        path: rel(ROUTES.freecell),
        lazy: async () => ({ Component: (await import('../pages/Freecell.tsx')).default }),
      },
      {
        path: rel(ROUTES.tangram),
        lazy: async () => ({ Component: (await import('../pages/Tangram.tsx')).default }),
      },
      {
        path: rel(ROUTES.flow),
        lazy: async () => ({ Component: (await import('../pages/Flow.tsx')).default }),
      },
      {
        path: rel(ROUTES.trafficJam),
        lazy: async () => ({ Component: (await import('../pages/TrafficJam.tsx')).default }),
      },
      {
        path: rel(ROUTES.hyperfokus),
        lazy: async () => ({ Component: (await import('../pages/Hyperfokus.tsx')).default }),
      },
      {
        path: rel(ROUTES.gfrett),
        lazy: async () => ({ Component: (await import('../pages/Gfrett.tsx')).default }),
      },
      {
        path: rel(ROUTES.colorFlood),
        lazy: async () => ({ Component: (await import('../pages/ColorFlood.tsx')).default }),
      },
      {
        path: rel(ROUTES.spellingBee),
        lazy: async () => ({ Component: (await import('../pages/SpellingBee.tsx')).default }),
      },
      {
        path: rel(ROUTES.bingo),
        lazy: async () => ({ Component: (await import('../pages/Bingo.tsx')).default }),
      },
      {
        path: rel(ROUTES.slotMachine),
        lazy: async () => ({ Component: (await import('../pages/SlotMachine.tsx')).default }),
      },
      {
        path: rel(ROUTES.idleClicker),
        lazy: async () => ({ Component: (await import('../pages/IdleClicker.tsx')).default }),
      },
      {
        path: rel(ROUTES.leiterspiel),
        lazy: async () => ({ Component: (await import('../pages/Ladders.tsx')).default }),
      },
    ],
  },
]);
