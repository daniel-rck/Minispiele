import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import KakuroGame from './KakuroGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('KakuroGame', () => {
  it('renders the grid, difficulty buttons, and numpad', () => {
    render(<KakuroGame />);
    expect(screen.getByRole('group', { name: /Kakuro-Spielfeld/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Leicht/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mittel/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Schwer/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zahl 1/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<KakuroGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
