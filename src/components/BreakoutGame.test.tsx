import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import BreakoutGame from './BreakoutGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('BreakoutGame', () => {
  it('renders the start button, score, level, lives and best in idle state', () => {
    render(<BreakoutGame />);
    expect(screen.getByRole('button', { name: /Starten/i })).toBeInTheDocument();
    expect(screen.getByText(/Punkte:/)).toBeInTheDocument();
    expect(screen.getByText(/Level:/)).toBeInTheDocument();
    expect(screen.getByText(/Leben:/)).toBeInTheDocument();
    expect(screen.getByText(/Best:/)).toBeInTheDocument();
  });

  it('renders the playing field with an application role', () => {
    render(<BreakoutGame />);
    expect(screen.getByRole('application', { name: /Breakout-Spielfeld/ })).toBeInTheDocument();
  });

  it('moves from idle to a ready-to-launch state on start', async () => {
    const user = userEvent.setup();
    render(<BreakoutGame />);
    await user.click(screen.getByRole('button', { name: /Starten/i }));
    expect(screen.getByText(/Tippen oder Leertaste/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Starten/i })).not.toBeInTheDocument();
  });

  it('mentions power-ups in the instructions', () => {
    render(<BreakoutGame />);
    expect(screen.getByText(/breiteres Paddel/)).toBeInTheDocument();
    expect(screen.getByText(/langsameren Ball/)).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<BreakoutGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
