import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';
import HyperfokusGame from './HyperfokusGame';

beforeEach(() => {
  window.localStorage.clear();
  class StubAudioContext {
    state = 'running';
    currentTime = 0;
    destination = {};
    createOscillator() {
      return {
        type: 'sine',
        frequency: { value: 0, setValueAtTime: () => undefined },
        connect: () => ({ connect: () => undefined }),
        start: () => undefined,
        stop: () => undefined,
      };
    }
    createGain() {
      return {
        gain: {
          value: 0,
          setValueAtTime: () => undefined,
          linearRampToValueAtTime: () => undefined,
          exponentialRampToValueAtTime: () => undefined,
        },
        connect: (t: unknown) => t,
      };
    }
    resume() {
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
  }
  vi.stubGlobal('AudioContext', StubAudioContext);
});

describe('HyperfokusGame', () => {
  it('mounts and renders core tap button', () => {
    render(<HyperfokusGame />);
    expect(screen.getByLabelText(/Hyperfokus-Kern tippen/i)).toBeTruthy();
  });

  it('increments score when core is tapped', async () => {
    render(<HyperfokusGame />);
    const core = screen.getByLabelText(/Hyperfokus-Kern tippen/i);
    await act(async () => {
      fireEvent.pointerDown(core, { clientX: 200, clientY: 200, button: 0 });
    });
    // Wait two animation frames so the smoothed counter catches up
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => setTimeout(r, 250));
    });
    // Score should be at least 1 — DEFAULT_SAVE starts at 0
    const stored = window.localStorage.getItem('minispiele.hyperfokus.save.v1');
    expect(stored).toBeTruthy();
    if (stored) {
      const parsed = JSON.parse(stored) as { coins: number; totalTaps: number };
      expect(parsed.totalTaps).toBeGreaterThanOrEqual(1);
      expect(parsed.coins).toBeGreaterThanOrEqual(1);
    }
  });

  it('opens upgrades sheet when button clicked', async () => {
    render(<HyperfokusGame />);
    const btn = screen.getByLabelText(/Upgrades öffnen/i);
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(screen.getByText(/Tipp-Kraft/i)).toBeTruthy();
  });
});
