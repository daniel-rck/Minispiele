import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SnakeGame from './SnakeGame';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

function headTransform(): string {
  const grid = screen.getByRole('grid', { name: /Snake-Spielfeld/ });
  const head = grid.querySelector('div');
  return head instanceof HTMLElement ? head.style.transform : '';
}

describe('SnakeGame', () => {
  it('renders the start button, score and best in idle state', () => {
    render(<SnakeGame />);
    expect(screen.getByRole('button', { name: /Starten/i })).toBeInTheDocument();
    expect(screen.getByText(/Punkte:/)).toBeInTheDocument();
    expect(screen.getByText(/Best:/)).toBeInTheDocument();
  });

  it('renders directional touch buttons for mobile', () => {
    render(<SnakeGame />);
    expect(screen.getByRole('button', { name: /Nach oben/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nach unten/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nach links/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nach rechts/ })).toBeInTheDocument();
  });

  it('shows the pause button after starting', async () => {
    const user = userEvent.setup();
    render(<SnakeGame />);
    await user.click(screen.getByRole('button', { name: /Starten/i }));
    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
  });

  it('renders the playing-field with the configured grid size', () => {
    render(<SnakeGame />);
    expect(screen.getByRole('grid', { name: /Snake-Spielfeld/ })).toBeInTheDocument();
  });

  it('ticks the snake forward on the game timer', async () => {
    vi.useFakeTimers();
    render(<SnakeGame />);
    fireEvent.click(screen.getByRole('button', { name: /Starten/i }));
    const before = headTransform();
    await act(async () => {
      vi.advanceTimersByTime(180);
    });
    const after = headTransform();
    expect(after).not.toBe(before);
    // moving right from the center of a 20×20 grid: 1000% -> 1100%
    expect(before).toContain('translate3d(1000%, 1000%');
    expect(after).toContain('translate3d(1100%, 1000%');
  });

  it('ignores direction input while paused', async () => {
    vi.useFakeTimers();
    render(<SnakeGame />);
    fireEvent.click(screen.getByRole('button', { name: /Starten/i }));
    fireEvent.click(screen.getByRole('button', { name: /Pause/i }));
    const paused = headTransform();
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    // paused: no ticking at all
    expect(headTransform()).toBe(paused);
    fireEvent.click(screen.getByRole('button', { name: /Fortsetzen/i }));
    await act(async () => {
      vi.advanceTimersByTime(180);
    });
    // the ArrowDown pressed during pause must not have been queued:
    // the snake keeps moving right (x grows) instead of turning down
    expect(headTransform()).toContain('translate3d(1100%, 1000%');
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<SnakeGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
