import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StroopGame from './StroopGame';

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

afterEach(() => {
  vi.restoreAllMocks();
});

describe('StroopGame', () => {
  it('renders the start button and four disabled color answers when idle', () => {
    render(<StroopGame />);
    expect(screen.getByRole('button', { name: /Starten/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rot' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Grün' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Blau' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Gelb' })).toBeDisabled();
  });

  it('enables the color answers after starting a round', async () => {
    const user = userEvent.setup();
    render(<StroopGame />);
    await user.click(screen.getByRole('button', { name: /Starten/i }));
    expect(screen.getByRole('button', { name: 'Rot' })).toBeEnabled();
  });

  it('increments the score on a correct answer', async () => {
    // Math.random fixed to 0.3 → nextChallenge falls back to { word: red, ink: green },
    // so the ink color is always green and "Grün" is the correct answer.
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const user = userEvent.setup();
    render(<StroopGame />);
    await user.click(screen.getByRole('button', { name: /Starten/i }));
    expect(screen.getByText(/Punkte:/).parentElement).toHaveTextContent('0');
    await user.click(screen.getByRole('button', { name: 'Grün' }));
    expect(screen.getByText(/Punkte:/).parentElement).toHaveTextContent('1');
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<StroopGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
