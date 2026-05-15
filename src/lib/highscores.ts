import type { Difficulty } from './ringSort';
import type { HighscoreEntry, Highscores } from './persistedSchemas';

export function isBetter(candidate: HighscoreEntry, existing: HighscoreEntry | null): boolean {
  if (!existing) return true;
  if (candidate.moves !== existing.moves) return candidate.moves < existing.moves;
  return candidate.seconds < existing.seconds;
}

export function applyHighscore(
  scores: Highscores,
  difficulty: Difficulty,
  entry: HighscoreEntry,
): { scores: Highscores; isNew: boolean } {
  const existing = scores[difficulty];
  if (!isBetter(entry, existing)) return { scores, isNew: false };
  return {
    scores: { ...scores, [difficulty]: entry },
    isNew: true,
  };
}
