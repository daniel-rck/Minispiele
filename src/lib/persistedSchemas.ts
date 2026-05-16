import { z } from 'zod';

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const MixSchema = z.boolean();

const DieTypeSchema = z.enum(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']);

export const PersistedDieSchema = z.object({
  type: DieTypeSchema,
  color: z.string().min(1).max(32),
  value: z.number().int().min(1).max(100),
  held: z.boolean(),
});

export const PersistedDiceSchema = z.array(PersistedDieSchema).max(64);

export const DiceHistoryEntrySchema = z.object({
  id: z.string().min(1).max(64),
  at: z.number().int().nonnegative(),
  sum: z.number().int(),
  dice: z
    .array(
      z.object({
        type: DieTypeSchema,
        value: z.number().int().min(1).max(100),
      }),
    )
    .max(64),
});

export const DiceHistorySchema = z.array(DiceHistoryEntrySchema).max(50);

export const DurationSchema = z
  .number()
  .int()
  .min(1)
  .max(99 * 60 + 59);

export const HighscoreEntrySchema = z.object({
  moves: z.number().int().nonnegative(),
  seconds: z.number().int().nonnegative(),
  at: z.number().int().nonnegative(),
});

export const HighscoresSchema = z.object({
  easy: HighscoreEntrySchema.nullable(),
  medium: HighscoreEntrySchema.nullable(),
  hard: HighscoreEntrySchema.nullable(),
});

export const TimerUserPresetsSchema = z.array(DurationSchema).max(3);

export const TimerDisplayModeSchema = z.enum(['flip', 'continuous']);

export const DiceModifierSchema = z.number().int().min(-999).max(999);

export const DiceRollDurationSchema = z.number().int().min(200).max(2500);

export const MemoryDifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const MemoryHighscoresSchema = z.object({
  easy: HighscoreEntrySchema.nullable(),
  medium: HighscoreEntrySchema.nullable(),
  hard: HighscoreEntrySchema.nullable(),
});

export const SlidingDifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const SlidingHighscoresSchema = z.object({
  easy: HighscoreEntrySchema.nullable(),
  medium: HighscoreEntrySchema.nullable(),
  hard: HighscoreEntrySchema.nullable(),
});

export const TwentyFortyEightStateSchema = z.object({
  grid: z.array(z.number().int().nonnegative()).length(16),
  score: z.number().int().nonnegative(),
  won: z.boolean(),
});

export const TwentyFortyEightBestSchema = z.number().int().nonnegative();

export const SimonBestSchema = z.number().int().nonnegative();

export const MinesDifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const MinesEntrySchema = z.object({
  seconds: z.number().int().nonnegative(),
  at: z.number().int().nonnegative(),
});

export const MinesHighscoresSchema = z.object({
  easy: MinesEntrySchema.nullable(),
  medium: MinesEntrySchema.nullable(),
  hard: MinesEntrySchema.nullable(),
});

export type HighscoreEntry = z.infer<typeof HighscoreEntrySchema>;
export type Highscores = z.infer<typeof HighscoresSchema>;
export type DiceHistoryEntry = z.infer<typeof DiceHistoryEntrySchema>;
export type DiceHistory = z.infer<typeof DiceHistorySchema>;
export type PersistedDie = z.infer<typeof PersistedDieSchema>;
export type MemoryDifficulty = z.infer<typeof MemoryDifficultySchema>;
export type MemoryHighscores = z.infer<typeof MemoryHighscoresSchema>;
export type SlidingDifficulty = z.infer<typeof SlidingDifficultySchema>;
export type SlidingHighscores = z.infer<typeof SlidingHighscoresSchema>;
export type TwentyFortyEightState = z.infer<typeof TwentyFortyEightStateSchema>;
export type TimerDisplayMode = z.infer<typeof TimerDisplayModeSchema>;
export type MinesDifficulty = z.infer<typeof MinesDifficultySchema>;
export type MinesEntry = z.infer<typeof MinesEntrySchema>;
export type MinesHighscores = z.infer<typeof MinesHighscoresSchema>;

export const EMPTY_MINES_HIGHSCORES: MinesHighscores = { easy: null, medium: null, hard: null };

export const EMPTY_HIGHSCORES: Highscores = { easy: null, medium: null, hard: null };
export const EMPTY_MEMORY_HIGHSCORES: MemoryHighscores = { easy: null, medium: null, hard: null };
export const EMPTY_SLIDING_HIGHSCORES: SlidingHighscores = { easy: null, medium: null, hard: null };
