/**
 * Global singleton for sound + haptics settings.
 *
 * The 29 game components stay untouched. Instead, SettingsProvider writes here on every change,
 * and the three central audio/haptic helpers (audio.ts, toneAudio.ts, useVibration.ts) read here
 * before producing output. Mute therefore propagates app-wide via a one-line check in each helper.
 */

let _soundEnabled = true;
let _hapticsEnabled = true;

export function setAudioSetting(enabled: boolean): void {
  _soundEnabled = enabled;
}

export function setHapticsSetting(enabled: boolean): void {
  _hapticsEnabled = enabled;
}

export function isAudioEnabled(): boolean {
  return _soundEnabled;
}

export function isHapticsEnabled(): boolean {
  return _hapticsEnabled;
}
