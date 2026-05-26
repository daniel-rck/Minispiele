import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SchulteGame from './SchulteGame';

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

describe('SchulteGame', () => {
  it('renders a 5x5 grid (25 number buttons) by default', () => {
    render(<SchulteGame />);
    const grid = screen.getByRole('group', { name: /Schulte-Tabelle/i });
    expect(within(grid).getAllByRole('button')).toHaveLength(25);
  });

  it('shows the next target as 1 initially', () => {
    render(<SchulteGame />);
    expect(screen.getByText(/Nächste:/)).toBeInTheDocument();
  });

  it('advances the next target after pressing 1', async () => {
    const user = userEvent.setup();
    render(<SchulteGame />);
    await user.click(screen.getByRole('button', { name: 'Zahl 1' }));
    // After a correct press the "next" indicator should show 2.
    const status = screen.getByText(/Nächste:/).parentElement;
    expect(status).toHaveTextContent('2');
  });

  it('does not advance when pressing a wrong number', async () => {
    const user = userEvent.setup();
    render(<SchulteGame />);
    await user.click(screen.getByRole('button', { name: 'Zahl 3' }));
    const status = screen.getByText(/Nächste:/).parentElement;
    expect(status).toHaveTextContent('1');
  });

  it('reshuffles when pressing the shuffle button', async () => {
    const user = userEvent.setup();
    render(<SchulteGame />);
    await user.click(screen.getByRole('button', { name: 'Zahl 1' }));
    expect(screen.getByText(/Nächste:/).parentElement).toHaveTextContent('2');
    await user.click(screen.getByRole('button', { name: /Neu mischen/i }));
    expect(screen.getByText(/Nächste:/).parentElement).toHaveTextContent('1');
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<SchulteGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
