import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BlocksGame from './BlocksGame';

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

describe('BlocksGame', () => {
  it('renders the playing field, the start button and five controls', () => {
    render(<BlocksGame />);
    expect(screen.getByRole('grid', { name: /Blockstapler-Feld/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Starten/i })).toBeInTheDocument();
    const controls = screen.getByRole('group', { name: /Steuerung/i });
    expect(within(controls).getAllByRole('button')).toHaveLength(5);
  });

  it('shows the score and level counters in the idle state', () => {
    render(<BlocksGame />);
    expect(screen.getByText(/Punkte:/)).toBeInTheDocument();
    expect(screen.getByText(/Lv:/)).toBeInTheDocument();
  });

  it('hides the start overlay once the game begins', async () => {
    const user = userEvent.setup();
    render(<BlocksGame />);
    await user.click(screen.getByRole('button', { name: /Starten/i }));
    expect(screen.queryByRole('button', { name: /Starten/i })).not.toBeInTheDocument();
    expect(screen.getByRole('grid', { name: /Blockstapler-Feld/i })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<BlocksGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
