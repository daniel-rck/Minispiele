import { getAudioCtor } from './audioContext';
import { isAudioEnabled } from './audioSettings';
import { AUDIO } from './constants';

export class AlarmAudio {
  private ctx: AudioContext | null = null;
  private intervalId: number | null = null;

  /** Initialise the AudioContext on a user gesture. Returns false if unavailable. */
  prime(): boolean {
    if (this.ctx) return true;
    const Ctor = getAudioCtor();
    if (!Ctor) return false;
    try {
      this.ctx = new Ctor();
    } catch (err) {
      console.warn('AlarmAudio: failed to create context', err);
      return false;
    }
    return true;
  }

  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => undefined);
    }
  }

  /** Start the repeating beep alarm. Returns false if audio is unavailable or muted. */
  start(): boolean {
    if (!isAudioEnabled()) return false;
    if (!this.prime()) return false;
    this.resume();
    this.beepOnce();
    this.stopInterval();
    this.intervalId = window.setInterval(() => this.beepOnce(), AUDIO.ALARM_INTERVAL_MS);
    return true;
  }

  stop(): void {
    this.stopInterval();
  }

  dispose(): void {
    this.stop();
    if (this.ctx) {
      void this.ctx.close().catch(() => undefined);
      this.ctx = null;
    }
  }

  /** True iff `start()` would produce sound. */
  isAvailable(): boolean {
    return getAudioCtor() !== null;
  }

  private stopInterval(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private beepOnce(): void {
    if (!isAudioEnabled()) return;
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = AUDIO.FREQUENCY_HZ;
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(AUDIO.GAIN_PEAK, now + AUDIO.GAIN_ATTACK_S);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + AUDIO.BEEP_DURATION_S);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + AUDIO.BEEP_DURATION_S + AUDIO.GAIN_TAIL_S);
    } catch (err) {
      console.warn('AlarmAudio: beep failed', err);
    }
  }
}
