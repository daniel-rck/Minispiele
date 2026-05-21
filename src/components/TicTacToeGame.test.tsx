import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import TicTacToeGame from './TicTacToeGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('TicTacToeGame', () => {
  it('renders the 3x3 grid and difficulty selector', () => {
    render(<TicTacToeGame />);
    expect(screen.getByRole('group', { name: /Tic-Tac-Toe-Spielfeld/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Feld \d+/ })).toHaveLength(9);
    expect(screen.getByRole('combobox', { name: /Schwierigkeit/i })).toBeInTheDocument();
  });

  it('places X when the player clicks an empty cell', async () => {
    const user = userEvent.setup();
    render(<TicTacToeGame />);
    const cells = screen.getAllByRole('button', { name: /Feld \d+/ });
    const middle = cells[4];
    if (!middle) throw new Error('expected 9 cells');
    await user.click(middle);
    expect(middle).toHaveTextContent('X');
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<TicTacToeGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
