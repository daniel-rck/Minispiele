export const AUDIO = {
  FREQUENCY_HZ: 880,
  BEEP_DURATION_S: 0.35,
  ALARM_INTERVAL_MS: 600,
  GAIN_PEAK: 0.3,
  GAIN_ATTACK_S: 0.01,
  GAIN_TAIL_S: 0.02,
} as const;

export const ANIMATION = {
  DICE_ROLL_MS: 450,
  DICE_ROLL_DEFAULT_MS: 900,
  DICE_ROLL_MIN_MS: 200,
  DICE_ROLL_MAX_MS: 2500,
  DICE_CYCLE_INTERVAL_MS: 60,
  HINT_HIGHLIGHT_MS: 1200,
  CONFETTI_MS: 1800,
  LONG_PRESS_MS: 700,
  ARIA_LIVE_DEBOUNCE_MS: 50,
  MEMORY_PEEK_MS: 800,
} as const;

export const HAPTICS = {
  DICE_TAP: 20,
  ALARM_PATTERN: [200, 100, 200, 100, 600],
} as const;

export const STORAGE_KEYS = {
  RING_DIFFICULTY: 'minispiele.ringSort.difficulty',
  RING_MIX: 'minispiele.ringSort.allowColorMix',
  RING_HIGHSCORES: 'minispiele.ringSort.highscores.v1',
  DICE_STATE: 'minispiele.dice.state.v1',
  DICE_MODIFIER: 'minispiele.dice.modifier.v1',
  DICE_HISTORY: 'minispiele.dice.history.v1',
  DICE_ROLL_DURATION: 'minispiele.dice.rollDurationMs.v1',
  TIMER_DURATION: 'minispiele.timer.durationSeconds',
  TIMER_PRESETS: 'minispiele.timer.userPresets.v1',
  TIMER_DISPLAY_MODE: 'minispiele.timer.displayMode.v1',
  MEMORY_DIFFICULTY: 'minispiele.memory.difficulty.v1',
  MEMORY_HIGHSCORES: 'minispiele.memory.highscores.v1',
  TFE_STATE: 'minispiele.tfe.state.v1',
  TFE_BEST: 'minispiele.tfe.bestScore.v1',
  SLIDING_DIFFICULTY: 'minispiele.sliding.difficulty.v1',
  SLIDING_HIGHSCORES: 'minispiele.sliding.highscores.v1',
} as const;
