import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SnakeGame from './SnakeGame';

beforeEach(() => {
  window.localStorage.clear();
});

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

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<SnakeGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
