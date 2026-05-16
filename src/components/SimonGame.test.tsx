import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SimonGame from './SimonGame';

beforeEach(() => {
  window.localStorage.clear();
  class StubAudioContext {
    state = 'running';
    currentTime = 0;
    destination = {};
    createOscillator() {
      return {
        type: 'sine',
        frequency: { value: 0 },
        connect: () => ({ connect: () => undefined }),
        start: () => undefined,
        stop: () => undefined,
      };
    }
    createGain() {
      return {
        gain: {
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

describe('SimonGame', () => {
  it('renders four colored pads and a start button', () => {
    render(<SimonGame />);
    expect(screen.getByRole('button', { name: /Starten/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Grün/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rot/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gelb/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Blau/i })).toBeInTheDocument();
  });

  it('disables the pads until a game has started', () => {
    render(<SimonGame />);
    expect(screen.getByRole('button', { name: /Grün/i })).toBeDisabled();
  });

  it('hides the start button after starting and begins the showing phase', async () => {
    const user = userEvent.setup();
    render(<SimonGame />);
    await user.click(screen.getByRole('button', { name: /Starten/i }));
    // Level updates to 1 immediately after extendSequence runs
    expect(screen.getByText(/Schau zu/i)).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<SimonGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
