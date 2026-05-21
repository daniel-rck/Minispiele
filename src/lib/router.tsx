import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from './routes.ts';

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
        path: 'ring-sort',
        lazy: async () => ({ Component: (await import('../pages/RingSort.tsx')).default }),
      },
      {
        path: 'timer',
        lazy: async () => ({ Component: (await import('../pages/Timer.tsx')).default }),
      },
      {
        path: 'dice',
        lazy: async () => ({ Component: (await import('../pages/Dice.tsx')).default }),
      },
      {
        path: 'memory',
        lazy: async () => ({ Component: (await import('../pages/Memory.tsx')).default }),
      },
      {
        path: 'twenty-forty-eight',
        lazy: async () => ({
          Component: (await import('../pages/TwentyFortyEight.tsx')).default,
        }),
      },
      {
        path: 'sliding-puzzle',
        lazy: async () => ({
          Component: (await import('../pages/SlidingPuzzle.tsx')).default,
        }),
      },
      {
        path: 'simon',
        lazy: async () => ({ Component: (await import('../pages/Simon.tsx')).default }),
      },
      {
        path: 'minesweeper',
        lazy: async () => ({ Component: (await import('../pages/Minesweeper.tsx')).default }),
      },
      {
        path: 'snake',
        lazy: async () => ({ Component: (await import('../pages/Snake.tsx')).default }),
      },
      {
        path: 'wordle',
        lazy: async () => ({ Component: (await import('../pages/Wordle.tsx')).default }),
      },
      {
        path: 'reaction',
        lazy: async () => ({ Component: (await import('../pages/Reaction.tsx')).default }),
      },
      {
        path: 'stroop',
        lazy: async () => ({ Component: (await import('../pages/Stroop.tsx')).default }),
      },
      {
        path: 'schulte',
        lazy: async () => ({ Component: (await import('../pages/Schulte.tsx')).default }),
      },
      {
        path: 'hanoi',
        lazy: async () => ({ Component: (await import('../pages/Hanoi.tsx')).default }),
      },
      {
        path: 'lights-out',
        lazy: async () => ({ Component: (await import('../pages/LightsOut.tsx')).default }),
      },
      {
        path: 'mastermind',
        lazy: async () => ({ Component: (await import('../pages/Mastermind.tsx')).default }),
      },
      {
        path: 'hangman',
        lazy: async () => ({ Component: (await import('../pages/Hangman.tsx')).default }),
      },
      {
        path: 'anagram',
        lazy: async () => ({ Component: (await import('../pages/Anagram.tsx')).default }),
      },
      {
        path: 'sudoku',
        lazy: async () => ({ Component: (await import('../pages/Sudoku.tsx')).default }),
      },
      {
        path: 'nonogram',
        lazy: async () => ({ Component: (await import('../pages/Nonogram.tsx')).default }),
      },
      {
        path: 'sokoban',
        lazy: async () => ({ Component: (await import('../pages/Sokoban.tsx')).default }),
      },
      {
        path: 'wordsearch',
        lazy: async () => ({ Component: (await import('../pages/Wordsearch.tsx')).default }),
      },
      {
        path: 'breakout',
        lazy: async () => ({ Component: (await import('../pages/Breakout.tsx')).default }),
      },
      {
        path: 'bubbles',
        lazy: async () => ({ Component: (await import('../pages/Bubbles.tsx')).default }),
      },
      {
        path: 'blocks',
        lazy: async () => ({ Component: (await import('../pages/Blocks.tsx')).default }),
      },
      {
        path: 'freecell',
        lazy: async () => ({ Component: (await import('../pages/Freecell.tsx')).default }),
      },
      {
        path: 'tangram',
        lazy: async () => ({ Component: (await import('../pages/Tangram.tsx')).default }),
      },
      {
        path: 'flow',
        lazy: async () => ({ Component: (await import('../pages/Flow.tsx')).default }),
      },
      {
        path: 'traffic-jam',
        lazy: async () => ({ Component: (await import('../pages/TrafficJam.tsx')).default }),
      },
      {
        path: 'hyperfokus',
        lazy: async () => ({ Component: (await import('../pages/Hyperfokus.tsx')).default }),
      },
      {
        path: 'gfrett',
        lazy: async () => ({ Component: (await import('../pages/Gfrett.tsx')).default }),
      },
      {
        path: 'color-flood',
        lazy: async () => ({ Component: (await import('../pages/ColorFlood.tsx')).default }),
      },
      {
        path: 'spelling-bee',
        lazy: async () => ({ Component: (await import('../pages/SpellingBee.tsx')).default }),
      },
      {
        path: 'bingo',
        lazy: async () => ({ Component: (await import('../pages/Bingo.tsx')).default }),
      },
      {
        path: 'slot-machine',
        lazy: async () => ({ Component: (await import('../pages/SlotMachine.tsx')).default }),
      },
      {
        path: 'idle-clicker',
        lazy: async () => ({ Component: (await import('../pages/IdleClicker.tsx')).default }),
      },
      {
        path: 'leiterspiel',
        lazy: async () => ({ Component: (await import('../pages/Ladders.tsx')).default }),
      },
    ],
  },
]);
