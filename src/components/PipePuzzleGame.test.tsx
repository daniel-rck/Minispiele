import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import PipePuzzleGame from './PipePuzzleGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('PipePuzzleGame', () => {
  it('renders the grid and controls', () => {
    render(<PipePuzzleGame />);
    expect(screen.getByRole('group', { name: /Pipe-Puzzle-Spielfeld/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Neues Rätsel/ })).toBeInTheDocument();
    expect(screen.getByText(/Züge:/)).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<PipePuzzleGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
