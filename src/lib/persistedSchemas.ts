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

export type HighscoreEntry = z.infer<typeof HighscoreEntrySchema>;
export type Highscores = z.infer<typeof HighscoresSchema>;
export type DiceHistoryEntry = z.infer<typeof DiceHistoryEntrySchema>;
export type DiceHistory = z.infer<typeof DiceHistorySchema>;
export type PersistedDie = z.infer<typeof PersistedDieSchema>;

export const EMPTY_HIGHSCORES: Highscores = { easy: null, medium: null, hard: null };
