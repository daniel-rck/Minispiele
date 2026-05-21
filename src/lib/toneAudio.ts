import { getAudioCtor } from './audioContext';
import { isAudioEnabled } from './audioSettings';

export interface PlayToneOptions {
  peak?: number;
  attackS?: number;
  type?: OscillatorType;
}

export class ToneAudio {
  private ctx: AudioContext | null = null;

  prime(): boolean {
    if (this.ctx) return true;
    const Ctor = getAudioCtor();
    if (!Ctor) return false;
    try {
      this.ctx = new Ctor();
    } catch (err) {
      console.warn('ToneAudio: failed to create context', err);
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
  }

  playTone(freq: number, durationMs: number, opts: PlayToneOptions = {}): void {
    if (!isAudioEnabled()) return;
    if (!this.prime()) return;
    this.resume();
    const ctx = this.ctx;
    if (!ctx) return;
    const { peak = 0.2, attackS = 0.01, type = 'sine' } = opts;
    const durS = Math.max(0.02, durationMs / 1000);
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak, now + attackS);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durS);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + durS + 0.02);
    } catch (err) {
      console.warn('ToneAudio: playTone failed', err);
    }
  }
}
