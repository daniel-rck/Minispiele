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

export const SnakeBestSchema = z.number().int().nonnegative();

export const WordleStatsSchema = z.object({
  played: z.number().int().nonnegative(),
  won: z.number().int().nonnegative(),
  currentStreak: z.number().int().nonnegative(),
  maxStreak: z.number().int().nonnegative(),
  distribution: z.array(z.number().int().nonnegative()).length(6),
});

export type WordleStats = z.infer<typeof WordleStatsSchema>;
export const EMPTY_WORDLE_STATS: WordleStats = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: [0, 0, 0, 0, 0, 0],
};

export const EMPTY_HIGHSCORES: Highscores = { easy: null, medium: null, hard: null };
export const EMPTY_MEMORY_HIGHSCORES: MemoryHighscores = { easy: null, medium: null, hard: null };
export const EMPTY_SLIDING_HIGHSCORES: SlidingHighscores = { easy: null, medium: null, hard: null };

// New games (brainstorm round 2)

export const NullableNonNegInt = z.number().int().nonnegative().nullable();

export const ReactionBestSchema = NullableNonNegInt;
export const StroopBestSchema = z.number().int().nonnegative();
export const SchulteSizeSchema = z.number().int().min(3).max(7);
export const SchulteBestSchema = z.record(z.string(), z.number().int().nonnegative());
export const HanoiDisksSchema = z.number().int().min(3).max(8);
export const HanoiBestSchema = z.record(z.string(), z.number().int().nonnegative());
export const LightsBestSchema = NullableNonNegInt;
export const MastermindBestSchema = NullableNonNegInt;

export const HangmanStatsSchema = z.object({
  played: z.number().int().nonnegative(),
  won: z.number().int().nonnegative(),
  currentStreak: z.number().int().nonnegative(),
  maxStreak: z.number().int().nonnegative(),
});
export type HangmanStats = z.infer<typeof HangmanStatsSchema>;
export const EMPTY_HANGMAN_STATS: HangmanStats = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
};

export const AnagramBestSchema = z.number().int().nonnegative();

export const SudokuDifficultySchema = z.enum(['easy', 'medium', 'hard']);
export type SudokuDifficulty = z.infer<typeof SudokuDifficultySchema>;

export const SudokuCellSchema = z.object({
  value: z.number().int().min(0).max(9),
  given: z.boolean(),
  notes: z.array(z.number().int().min(1).max(9)).max(9),
});
export const SudokuStateSchema = z
  .object({
    difficulty: SudokuDifficultySchema,
    puzzle: z.array(SudokuCellSchema).length(81),
    solution: z.array(z.number().int().min(1).max(9)).length(81),
    seconds: z.number().int().nonnegative(),
  })
  .nullable();
export type SudokuState = z.infer<typeof SudokuStateSchema>;

export const SudokuBestSchema = z.record(z.string(), z.number().int().nonnegative());

export const NonogramSizeSchema = z.number().int().min(5).max(10);
export const NonogramBestSchema = z.record(z.string(), z.number().int().nonnegative());

export const SokobanLevelSchema = z.number().int().min(0).max(99);
export const SokobanBestSchema = z.record(z.string(), z.number().int().nonnegative());

export const WordsearchBestSchema = NullableNonNegInt;
export const BreakoutBestSchema = z.number().int().nonnegative();
export const BubblesBestSchema = z.number().int().nonnegative();
export const BlocksBestSchema = z.number().int().nonnegative();
export const FreecellBestSchema = NullableNonNegInt;
export const TangramLevelSchema = z.number().int().min(0).max(99);
export const FlowBestSchema = z.record(z.string(), z.number().int().nonnegative());

export const TrafficJamDifficultySchema = z.enum(['easy', 'medium', 'hard']);
export const TrafficJamHighscoresSchema = z.object({
  easy: HighscoreEntrySchema.nullable(),
  medium: HighscoreEntrySchema.nullable(),
  hard: HighscoreEntrySchema.nullable(),
});
export type TrafficJamDifficulty = z.infer<typeof TrafficJamDifficultySchema>;
export type TrafficJamHighscores = z.infer<typeof TrafficJamHighscoresSchema>;
export const EMPTY_TRAFFIC_JAM_HIGHSCORES: TrafficJamHighscores = {
  easy: null,
  medium: null,
  hard: null,
};

export const HyperfokusThemeSchema = z.enum(['default', 'neon', 'kosmos', 'aurora']);
export type HyperfokusTheme = z.infer<typeof HyperfokusThemeSchema>;

export const HyperfokusUpgradesSchema = z.object({
  tapPower: z.number().int().nonnegative(),
  autoTapper: z.number().int().nonnegative(),
  critChance: z.number().int().nonnegative(),
  critMulti: z.number().int().nonnegative(),
  comboDecay: z.number().int().nonnegative(),
  eventRate: z.number().int().nonnegative(),
});
export type HyperfokusUpgrades = z.infer<typeof HyperfokusUpgradesSchema>;

export const HyperfokusSaveSchema = z.object({
  version: z.literal(1),
  coins: z.number().nonnegative(),
  totalTaps: z.number().int().nonnegative(),
  allTimeBest: z.number().nonnegative(),
  prestigeCrystals: z.number().int().nonnegative(),
  prestigeCount: z.number().int().nonnegative(),
  upgrades: HyperfokusUpgradesSchema,
  unlockedAchievements: z.array(z.string().max(64)).max(64),
  currentTheme: HyperfokusThemeSchema,
  lastSavedAt: z.number().nonnegative(),
});
export type HyperfokusSave = z.infer<typeof HyperfokusSaveSchema>;

export const GfrettLevelSchema = z.number().int().min(0).max(99);
export const GfrettBestSchema = z.record(z.string(), z.number().int().nonnegative());

export const ColorFloodBestSchema = NullableNonNegInt;

export const SpellingBeeBestSchema = z.number().int().nonnegative();

export const BingoBestSchema = NullableNonNegInt;

export const SlotMachineBestSchema = z.number().int().nonnegative();

export const IdleClickerSaveSchema = z.object({
  version: z.literal(1),
  points: z.number().nonnegative(),
  totalEarned: z.number().nonnegative(),
  multiplier: z.number().int().nonnegative().max(1000),
  upgradeCounts: z.array(z.number().int().nonnegative()).max(32),
});
export type IdleClickerSave = z.infer<typeof IdleClickerSaveSchema>;

export const LadderBestSchema = NullableNonNegInt;

export const TicTacToeDifficultySchema = z.enum(['easy', 'medium', 'hard']);
export type TicTacToeDifficulty = z.infer<typeof TicTacToeDifficultySchema>;

export const TicTacToeScoresSchema = z.object({
  x: z.number().int().nonnegative(),
  o: z.number().int().nonnegative(),
  d: z.number().int().nonnegative(),
});
export type TicTacToeScores = z.infer<typeof TicTacToeScoresSchema>;

export const AsteroidsBestSchema = z.number().int().nonnegative();

export const BinairoSizeSchema = z.union([z.literal(6), z.literal(8), z.literal(10)]);
export type BinairoSize = z.infer<typeof BinairoSizeSchema>;

export const ColumnsBestSchema = z.number().int().nonnegative();

export const DoodleJumpBestSchema = z.number().int().nonnegative();

export const FlappyBirdBestSchema = z.number().int().nonnegative();

export const FroggerBestSchema = z.number().int().nonnegative();
