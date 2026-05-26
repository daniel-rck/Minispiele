export interface AnagramTile {
  id: number;
  letter: string;
  placed: boolean;
}

export function scrambleLetters(word: string, rng: () => number = Math.random): AnagramTile[] {
  const letters = word.split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [letters[i], letters[j]] = [letters[j]!, letters[i]!];
  }
  // Guarantee the scramble differs from the original for multi-letter words.
  if (letters.join('') === word && word.length > 1) {
    [letters[0], letters[1]] = [letters[1]!, letters[0]!];
  }
  return letters.map((l, idx) => ({ id: idx, letter: l, placed: false }));
}

export function verifyGuess(slots: (AnagramTile | null)[], word: string): boolean {
  if (slots.some((s) => s === null)) return false;
  return slots.map((s) => s!.letter).join('') === word;
}
