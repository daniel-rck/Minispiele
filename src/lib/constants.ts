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
  HINT_HIGHLIGHT_MS: 1200,
  CONFETTI_MS: 1800,
  LONG_PRESS_MS: 700,
  ARIA_LIVE_DEBOUNCE_MS: 50,
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
  TIMER_DURATION: 'minispiele.timer.durationSeconds',
  TIMER_PRESETS: 'minispiele.timer.userPresets.v1',
} as const;
