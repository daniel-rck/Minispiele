import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import PentominoGame from './PentominoGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('PentominoGame', () => {
  it('renders the board and pieces panel', () => {
    render(<PentominoGame />);
    expect(screen.getByRole('group', { name: /Pentomino-Spielbrett/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Pentomino-Teile/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Drehen/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Spiegeln/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<PentominoGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
