import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { DIFFICULTY } from '../lib/minesweeper';
import MinesweeperGame from './MinesweeperGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('MinesweeperGame', () => {
  it('renders a grid with the easy difficulty by default', () => {
    render(<MinesweeperGame />);
    const total = DIFFICULTY.easy.cols * DIFFICULTY.easy.rows;
    expect(screen.getAllByRole('button', { name: /Zelle \d+/ })).toHaveLength(total);
  });

  it('reveals cells when clicked and removes the verdeckt label', async () => {
    const user = userEvent.setup();
    render(<MinesweeperGame />);
    const before = screen.getAllByRole('button', { name: /verdeckt/ }).length;
    const firstCell = screen.getByRole('button', { name: /Zelle 1, verdeckt/ });
    await user.click(firstCell);
    const after = screen.queryAllByRole('button', { name: /verdeckt/ }).length;
    expect(after).toBeLessThan(before);
  });

  it('toggles the flag mode via the flag button', async () => {
    const user = userEvent.setup();
    render(<MinesweeperGame />);
    const flagBtn = screen.getByRole('button', { name: /Flaggen-Modus einschalten/ });
    expect(flagBtn).toHaveAttribute('aria-pressed', 'false');
    await user.click(flagBtn);
    expect(screen.getByRole('button', { name: /Flaggen-Modus aktiv/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('changes difficulty via the select and rebuilds the grid', async () => {
    const user = userEvent.setup();
    render(<MinesweeperGame />);
    await user.selectOptions(screen.getByLabelText(/Schwierigkeit/), 'medium');
    const total = DIFFICULTY.medium.cols * DIFFICULTY.medium.rows;
    expect(screen.getAllByRole('button', { name: /Zelle \d+/ })).toHaveLength(total);
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<MinesweeperGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
