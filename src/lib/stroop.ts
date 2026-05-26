export interface StroopColor {
  key: string;
  label: string;
}

export const STROOP_COLORS: readonly StroopColor[] = [
  { key: 'red', label: 'Rot' },
  { key: 'green', label: 'Grün' },
  { key: 'blue', label: 'Blau' },
  { key: 'yellow', label: 'Gelb' },
];

export const STROOP_ROUND_SECONDS = 30;

export interface StroopChallenge {
  word: StroopColor;
  ink: StroopColor;
}

export function nextChallenge(
  prev?: StroopChallenge,
  rng: () => number = Math.random,
): StroopChallenge {
  for (let i = 0; i < 50; i++) {
    const word = STROOP_COLORS[Math.floor(rng() * STROOP_COLORS.length)]!;
    const ink = STROOP_COLORS[Math.floor(rng() * STROOP_COLORS.length)]!;
    if (word.key === ink.key) continue;
    if (prev && prev.word.key === word.key && prev.ink.key === ink.key) continue;
    return { word, ink };
  }
  return { word: STROOP_COLORS[0]!, ink: STROOP_COLORS[1]! };
}

export function scoreAnswer(challenge: StroopChallenge, answerKey: string): 'correct' | 'wrong' {
  return answerKey === challenge.ink.key ? 'correct' : 'wrong';
}
