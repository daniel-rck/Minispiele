import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReactionGame from './ReactionGame';

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

describe('ReactionGame', () => {
  it('renders the idle prompt and reaction surface', () => {
    render(<ReactionGame />);
    expect(screen.getByRole('button', { name: /Reaktionsfeld/i })).toBeInTheDocument();
    expect(screen.getByText(/Tippe um zu starten/i)).toBeInTheDocument();
  });

  it('shows last reaction and best placeholders before the first round', () => {
    render(<ReactionGame />);
    expect(screen.getByText(/Letzte:/)).toBeInTheDocument();
    expect(screen.getByText(/Best:/)).toBeInTheDocument();
  });

  it('transitions from idle to waiting on tap', async () => {
    const user = userEvent.setup();
    render(<ReactionGame />);
    const surface = screen.getByRole('button', { name: /Reaktionsfeld/i });
    await user.click(surface);
    expect(screen.getByText(/Warte auf Grün/i)).toBeInTheDocument();
  });

  it('shows "Zu früh!" when tapping during the waiting phase', async () => {
    const user = userEvent.setup();
    render(<ReactionGame />);
    const surface = screen.getByRole('button', { name: /Reaktionsfeld/i });
    await user.click(surface); // idle → waiting
    await user.click(surface); // waiting → tooEarly (tapped before ready)
    expect(screen.getByText(/Zu früh/i)).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<ReactionGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
