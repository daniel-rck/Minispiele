import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import Match3Game from './Match3Game';

beforeEach(() => {
  window.localStorage.clear();
});

describe('Match3Game', () => {
  it('renders the board and HUD', () => {
    render(<Match3Game />);
    expect(screen.getByRole('group', { name: /Match-3-Spielfeld/ })).toBeInTheDocument();
    expect(screen.getByText(/Züge:/)).toBeInTheDocument();
    expect(screen.getByText(/Best:/)).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<Match3Game />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
