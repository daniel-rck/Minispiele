import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AnagramGame from './AnagramGame';
import AsteroidsGame from './AsteroidsGame';
import BinairoGame from './BinairoGame';
import BlocksGame from './BlocksGame';
import BreakoutGame from './BreakoutGame';
import BubblesGame from './BubblesGame';
import ColumnsGame from './ColumnsGame';
import ConnectionsGame from './ConnectionsGame';
import ConwayBattleGame from './ConwayBattleGame';
import DoodleJumpGame from './DoodleJumpGame';
import FlowGame from './FlowGame';
import FreecellGame from './FreecellGame';
import GfrettGame from './GfrettGame';
import HangmanGame from './HangmanGame';
import HanoiGame from './HanoiGame';
import HyperfokusGame from './HyperfokusGame';
import LightsOutGame from './LightsOutGame';
import MastermindGame from './MastermindGame';
import MemoryGame from './MemoryGame';
import NonogramGame from './NonogramGame';
import ReactionGame from './ReactionGame';
import SchulteGame from './SchulteGame';
import SlidingPuzzleGame from './SlidingPuzzleGame';
import SokobanGame from './SokobanGame';
import StroopGame from './StroopGame';
import SudokuGame from './SudokuGame';
import TangramGame from './TangramGame';
import TicTacToeGame from './TicTacToeGame';
import TrafficJamGame from './TrafficJamGame';
import TwentyFortyEightGame from './TwentyFortyEightGame';
import WordsearchGame from './WordsearchGame';

beforeEach(() => {
  window.localStorage.clear();

  class StubAudioContext {
    state = 'running';
    currentTime = 0;
    destination = {};
    createOscillator() {
      return {
        type: 'sine',
        frequency: { value: 0, setValueAtTime: () => undefined },
        connect: () => ({ connect: () => undefined }),
        start: () => undefined,
        stop: () => undefined,
      };
    }
    createGain() {
      return {
        gain: {
          value: 0,
          setValueAtTime: () => undefined,
          linearRampToValueAtTime: () => undefined,
          exponentialRampToValueAtTime: () => undefined,
        },
        connect: (t: unknown) => t,
      };
    }
    resume() {
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
  }
  vi.stubGlobal('AudioContext', StubAudioContext);
});

const cases: Array<[string, () => React.ReactElement]> = [
  ['AnagramGame', () => <AnagramGame />],
  ['AsteroidsGame', () => <AsteroidsGame />],
  ['BinairoGame', () => <BinairoGame />],
  ['BlocksGame', () => <BlocksGame />],
  ['BreakoutGame', () => <BreakoutGame />],
  ['BubblesGame', () => <BubblesGame />],
  ['ColumnsGame', () => <ColumnsGame />],
  ['ConnectionsGame', () => <ConnectionsGame />],
  ['ConwayBattleGame', () => <ConwayBattleGame />],
  ['DoodleJumpGame', () => <DoodleJumpGame />],
  ['FlowGame', () => <FlowGame />],
  ['FreecellGame', () => <FreecellGame />],
  ['GfrettGame', () => <GfrettGame />],
  ['HangmanGame', () => <HangmanGame />],
  ['HanoiGame', () => <HanoiGame />],
  ['LightsOutGame', () => <LightsOutGame />],
  ['MastermindGame', () => <MastermindGame />],
  ['MemoryGame', () => <MemoryGame />],
  ['NonogramGame', () => <NonogramGame />],
  ['ReactionGame', () => <ReactionGame />],
  ['SchulteGame', () => <SchulteGame />],
  ['SlidingPuzzleGame', () => <SlidingPuzzleGame />],
  ['SokobanGame', () => <SokobanGame />],
  ['StroopGame', () => <StroopGame />],
  ['SudokuGame', () => <SudokuGame />],
  ['TangramGame', () => <TangramGame />],
  ['TicTacToeGame', () => <TicTacToeGame />],
  ['TrafficJamGame', () => <TrafficJamGame />],
  ['TwentyFortyEightGame', () => <TwentyFortyEightGame />],
  ['WordsearchGame', () => <WordsearchGame />],
  ['HyperfokusGame', () => <HyperfokusGame />],
];

describe('game components smoke render', () => {
  for (const [name, factory] of cases) {
    it(`${name} mounts without crashing`, () => {
      const { container } = render(factory());
      expect(container.firstChild).toBeTruthy();
    });
  }
});
