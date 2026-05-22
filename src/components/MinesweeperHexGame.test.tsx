import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import MinesweeperHexGame from './MinesweeperHexGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('MinesweeperHexGame', () => {
  it('renders the canvas and controls', () => {
    render(<MinesweeperHexGame />);
    expect(screen.getByLabelText(/Hex-Minensucher Spielfeld/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Neues Spiel/ })).toBeInTheDocument();
    expect(screen.getByText(/Minen:/)).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<MinesweeperHexGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
