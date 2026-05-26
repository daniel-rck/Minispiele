import { describe, expect, it } from 'vitest';
import { type AnagramTile, scrambleLetters, verifyGuess } from './anagram';

function seededRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

function tilesFromWord(word: string): AnagramTile[] {
  return word.split('').map((letter, id) => ({ id, letter, placed: true }));
}

describe('anagram', () => {
  it('scrambleLetters preserves the exact multiset of letters', () => {
    const tiles = scrambleLetters('HALLO', seededRng([0.1, 0.5, 0.9, 0.3]));
    const sorted = tiles
      .map((t) => t.letter)
      .sort()
      .join('');
    expect(sorted).toBe('AHLLO');
    expect(tiles).toHaveLength(5);
  });

  it('scrambleLetters marks every tile as not placed and assigns sequential ids', () => {
    const tiles = scrambleLetters('ABC', seededRng([0]));
    expect(tiles.map((t) => t.placed)).toEqual([false, false, false]);
    expect(tiles.map((t) => t.id)).toEqual([0, 1, 2]);
  });

  it('scrambleLetters never equals the original for multi-letter words', () => {
    // rng=0 leaves the array unchanged; the guard then swaps the first two letters.
    const tiles = scrambleLetters('AB', seededRng([0]));
    expect(tiles.map((t) => t.letter).join('')).toBe('BA');
  });

  it('scrambleLetters is deterministic for a given rng', () => {
    const a = scrambleLetters('PUZZLE', seededRng([0.2, 0.4, 0.6, 0.8, 0.1]));
    const b = scrambleLetters('PUZZLE', seededRng([0.2, 0.4, 0.6, 0.8, 0.1]));
    expect(a.map((t) => t.letter)).toEqual(b.map((t) => t.letter));
  });

  it('verifyGuess returns true when the slots spell the word', () => {
    expect(verifyGuess(tilesFromWord('KATZE'), 'KATZE')).toBe(true);
  });

  it('verifyGuess returns false for a wrong arrangement', () => {
    const tiles = tilesFromWord('KAT');
    const swapped = [tiles[1]!, tiles[0]!, tiles[2]!];
    expect(verifyGuess(swapped, 'KAT')).toBe(false);
  });

  it('verifyGuess returns false when a slot is still empty', () => {
    const tiles: (AnagramTile | null)[] = [
      { id: 0, letter: 'A', placed: true },
      null,
      { id: 2, letter: 'C', placed: true },
    ];
    expect(verifyGuess(tiles, 'ABC')).toBe(false);
  });
});
