import { getAudioCtor } from './audioContext';
import { isAudioEnabled } from './audioSettings';

const NOISE_DURATION_S = 0.25;
const CLICK_MIN_INTERVAL_MS = 35;
const CLICK_MAX_INTERVAL_MS = 90;

/**
 * Synthesises dice-roll sound effects from filtered white noise.
 * Sharp, short clicks during the rattle and a softer thud when each die settles.
 */
export class DiceSound {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  prime(): boolean {
    if (this.ctx) return true;
    const Ctor = getAudioCtor();
    if (!Ctor) return false;
    try {
      this.ctx = new Ctor();
    } catch (err) {
      console.warn('DiceSound: failed to create context', err);
      return false;
    }
    return true;
  }

  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => undefined);
    }
  }

  isAvailable(): boolean {
    return getAudioCtor() !== null;
  }

  dispose(): void {
    if (this.ctx) {
      void this.ctx.close().catch(() => undefined);
      this.ctx = null;
    }
    this.noiseBuffer = null;
  }

  /** Schedule a series of rattle clicks across the given roll duration. */
  playRoll(durationMs: number, diceCount = 1): void {
    if (!isAudioEnabled()) return;
    if (!this.prime()) return;
    this.resume();
    const ctx = this.ctx;
    if (!ctx) return;

    const dur = Math.max(120, durationMs);
    const density = Math.min(2.5, 0.8 + diceCount * 0.25);
    let t = 0;
    while (t < dur) {
      this.scheduleClick(ctx.currentTime + t / 1000, 'rattle');
      const gap =
        (CLICK_MIN_INTERVAL_MS + Math.random() * (CLICK_MAX_INTERVAL_MS - CLICK_MIN_INTERVAL_MS)) /
        density;
      t += gap;
    }
  }

  /** Final settle thud — call once when the roll finishes. */
  playSettle(diceCount = 1): void {
    if (!isAudioEnabled()) return;
    if (!this.prime()) return;
    this.resume();
    const ctx = this.ctx;
    if (!ctx) return;

    const taps = Math.min(3, Math.max(1, Math.ceil(diceCount / 2)));
    for (let i = 0; i < taps; i++) {
      this.scheduleClick(ctx.currentTime + i * 0.04 + Math.random() * 0.02, 'settle');
    }
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const length = Math.floor(ctx.sampleRate * NOISE_DURATION_S);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
    return buffer;
  }

  private scheduleClick(when: number, kind: 'rattle' | 'settle'): void {
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const src = ctx.createBufferSource();
      src.buffer = this.getNoiseBuffer(ctx);
      src.playbackRate.value = 0.85 + Math.random() * 0.3;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      if (kind === 'rattle') {
        filter.frequency.value = 1400 + Math.random() * 600;
        filter.Q.value = 3.5;
      } else {
        filter.frequency.value = 380 + Math.random() * 120;
        filter.Q.value = 2;
      }

      const gain = ctx.createGain();
      const peak = kind === 'rattle' ? 0.22 + Math.random() * 0.08 : 0.32;
      const decayS = kind === 'rattle' ? 0.035 : 0.09;
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(peak, when + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + decayS);

      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start(when);
      src.stop(when + decayS + 0.05);
    } catch (err) {
      console.warn('DiceSound: click failed', err);
    }
  }
}
