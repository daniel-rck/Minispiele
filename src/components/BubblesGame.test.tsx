import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BubblesGame from './BubblesGame';

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

describe('BubblesGame', () => {
  it('renders the playing field, the score and a restart button', () => {
    render(<BubblesGame />);
    expect(screen.getByRole('application', { name: /Blasenschießen/i })).toBeInTheDocument();
    expect(screen.getByText(/Punkte:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nochmal spielen/i })).toBeInTheDocument();
  });

  it('starts with the top four rows filled (32 bubbles)', () => {
    const { container } = render(<BubblesGame />);
    expect(container.querySelectorAll('[data-testid="bubble-cell"]')).toHaveLength(32);
  });

  it('keeps a populated field after pressing "Nochmal spielen"', async () => {
    const user = userEvent.setup();
    const { container } = render(<BubblesGame />);
    await user.click(screen.getByRole('button', { name: /Nochmal spielen/i }));
    expect(container.querySelectorAll('[data-testid="bubble-cell"]')).toHaveLength(32);
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<BubblesGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
