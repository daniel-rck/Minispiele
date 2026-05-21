import { getAudioCtor } from './audioContext';
import { isAudioEnabled } from './audioSettings';

const NOISE_DURATION_S = 0.2;

interface ToneOptions {
  type?: OscillatorType;
  peak?: number;
  attackS?: number;
  decayS?: number;
  glideToHz?: number;
}

/**
 * Reusable, synth-only game sound effects. One AudioContext per game component.
 * All methods are no-op when audio is globally muted or the platform lacks WebAudio.
 */
export class GameSfx {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  prime(): boolean {
    if (this.ctx) return true;
    const Ctor = getAudioCtor();
    if (!Ctor) return false;
    try {
      this.ctx = new Ctor();
    } catch (err) {
      console.warn('GameSfx: failed to create context', err);
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

  /** Three ascending notes — short victory jingle. */
  win(): void {
    if (!this.ready()) return;
    this.tone(523.25, { decayS: 0.16, peak: 0.22 });
    this.tone(659.25, { decayS: 0.18, peak: 0.22 }, 0.09);
    this.tone(783.99, { decayS: 0.28, peak: 0.24 }, 0.2);
  }

  /** Three descending notes — defeat. */
  lose(): void {
    if (!this.ready()) return;
    this.tone(392.0, { decayS: 0.18, peak: 0.22, type: 'triangle' });
    this.tone(311.13, { decayS: 0.22, peak: 0.22, type: 'triangle' }, 0.11);
    this.tone(261.63, { decayS: 0.4, peak: 0.22, type: 'triangle' }, 0.25);
  }

  /** Short bright ping — correct match / found word / hit. */
  match(): void {
    if (!this.ready()) return;
    this.tone(880, { decayS: 0.14, peak: 0.2, type: 'sine' });
  }

  /** Short low buzz — invalid / mistake. */
  error(): void {
    if (!this.ready()) return;
    this.tone(120, { decayS: 0.18, peak: 0.18, type: 'sawtooth' });
  }

  /** Descending sweep — line cleared / word completed / area filled. */
  clear(): void {
    if (!this.ready()) return;
    this.tone(880, { decayS: 0.3, peak: 0.22, type: 'sine', glideToHz: 440 });
  }

  /** Noise-based pop — bubble burst / brick hit. */
  pop(): void {
    if (!this.ready()) return;
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const src = ctx.createBufferSource();
      src.buffer = this.getNoiseBuffer(ctx);
      src.playbackRate.value = 0.9 + Math.random() * 0.3;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1600 + Math.random() * 600;
      filter.Q.value = 4;
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start(now);
      src.stop(now + 0.12);
    } catch (err) {
      console.warn('GameSfx: pop failed', err);
    }
  }

  /**
   * Tile merge tone — pitch scales with `rank` (0 = low, ~11 = 2048 tile).
   * Clamped so even huge tiles stay listenable.
   */
  merge(rank: number): void {
    if (!this.ready()) return;
    const safe = Math.max(0, Math.min(rank, 11));
    const freq = 220 * 2 ** (safe / 6);
    this.tone(freq, { decayS: 0.18, peak: 0.2, type: 'triangle' });
  }

  /** Short high tick — slot machine reel stopping. */
  reelTick(): void {
    if (!this.ready()) return;
    this.tone(1500, { decayS: 0.05, peak: 0.18, type: 'square' });
  }

  private ready(): boolean {
    if (!isAudioEnabled()) return false;
    if (!this.prime()) return false;
    this.resume();
    return this.ctx !== null;
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

  private tone(freq: number, opts: ToneOptions = {}, delayS = 0): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const { type = 'sine', peak = 0.2, attackS = 0.005, decayS = 0.15, glideToHz } = opts;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      const start = ctx.currentTime + delayS;
      osc.frequency.setValueAtTime(freq, start);
      if (glideToHz !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, glideToHz), start + decayS);
      }
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(peak, start + attackS);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + decayS);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + decayS + 0.04);
    } catch (err) {
      console.warn('GameSfx: tone failed', err);
    }
  }
}
