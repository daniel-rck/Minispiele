import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import GameOfLifeGame from './GameOfLifeGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('GameOfLifeGame', () => {
  it('renders the controls and grid', () => {
    render(<GameOfLifeGame />);
    expect(screen.getByRole('button', { name: /Start/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Schritt/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zufall/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Game-of-Life-Spielfeld/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<GameOfLifeGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
