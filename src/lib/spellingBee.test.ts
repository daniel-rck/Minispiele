import { describe, expect, it } from 'vitest';
import {
  findValidWords,
  generatePuzzle,
  isPangram,
  SPELLING_BEE_LETTERS,
  SPELLING_BEE_MIN_WORD_LENGTH,
  SPELLING_BEE_PANGRAM_BONUS,
  scoreWord,
  submitWord,
  wordIsValidForLetters,
} from './spellingBee';

function seededRng(seed = 1): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

describe('spellingBee', () => {
  it('wordIsValidForLetters rejects short, off-letter, or centre-less words', () => {
    const letters = new Set(['A', 'B', 'C', 'D']);
    expect(wordIsValidForLetters('AB', 'A', letters)).toBe(false);
    expect(wordIsValidForLetters('ABCD', 'A', letters)).toBe(true);
    expect(wordIsValidForLetters('BBCD', 'A', letters)).toBe(false);
    expect(wordIsValidForLetters('ABCE', 'A', letters)).toBe(false);
  });

  it('findValidWords filters the dictionary to puzzle-legal words', () => {
    const letters = new Set(['B', 'A', 'U', 'M', 'R', 'D', 'T']);
    const words = findValidWords(letters, 'A', ['BAUM', 'AB', 'BART', 'BLAU', 'TRAUM']);
    expect(words).toEqual(['BART', 'BAUM', 'TRAUM']);
  });

  it('isPangram requires every puzzle letter to appear at least once', () => {
    const letters = new Set(['A', 'B', 'C']);
    expect(isPangram('ABCA', letters)).toBe(true);
    expect(isPangram('AB', letters)).toBe(false);
  });

  it('scoreWord gives 1 point for 4-letter words and word length for longer ones', () => {
    const letters = new Set(['A', 'B', 'C', 'D']);
    expect(scoreWord('ABCD', letters)).toBe(SPELLING_BEE_PANGRAM_BONUS + 1);
    expect(scoreWord('XABCDY', new Set(['X', 'A', 'B', 'C', 'D', 'Y', 'Z']))).toBe(6);
  });

  it('scoreWord pangram bonus stacks with length-based score', () => {
    const letters = new Set(['A', 'B', 'C', 'D', 'E']);
    const word = 'ABCDE';
    expect(scoreWord(word, letters)).toBe(word.length + SPELLING_BEE_PANGRAM_BONUS);
  });

  it('generatePuzzle yields seven letters with a non-empty word list (for real dict)', () => {
    const puzzle = generatePuzzle(seededRng(42));
    expect(puzzle.outer.length).toBe(SPELLING_BEE_LETTERS - 1);
    expect(puzzle.letters.size).toBe(SPELLING_BEE_LETTERS);
    expect(puzzle.letters.has(puzzle.center)).toBe(true);
    expect(puzzle.validWords.length).toBeGreaterThan(0);
    for (const word of puzzle.validWords) {
      expect(word.length).toBeGreaterThanOrEqual(SPELLING_BEE_MIN_WORD_LENGTH);
      expect(word.includes(puzzle.center)).toBe(true);
    }
  });

  it('submitWord reports the various rejection reasons', () => {
    const puzzle = {
      center: 'A',
      outer: ['B', 'C', 'D', 'E', 'F', 'G'],
      letters: new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G']),
      validWords: ['BEAD', 'FACE'],
    };
    const found = new Set<string>();
    expect(submitWord('ab', puzzle, found).kind).toBe('too-short');
    expect(submitWord('bcde', puzzle, found).kind).toBe('missing-center');
    expect(submitWord('axyz', puzzle, found).kind).toBe('invalid-letters');
    expect(submitWord('cafe', puzzle, found).kind).toBe('unknown');
    const accepted = submitWord('bead', puzzle, found);
    expect(accepted.kind).toBe('accepted');
    if (accepted.kind === 'accepted') {
      expect(accepted.word).toBe('BEAD');
      expect(accepted.points).toBeGreaterThan(0);
    }
    found.add('BEAD');
    expect(submitWord('bead', puzzle, found).kind).toBe('already-found');
  });
});
