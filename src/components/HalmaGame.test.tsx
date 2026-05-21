import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import HalmaGame from './HalmaGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('HalmaGame', () => {
  it('renders the board and HUD', () => {
    render(<HalmaGame />);
    expect(screen.getByRole('group', { name: /Halma-Spielfeld/ })).toBeInTheDocument();
    expect(screen.getByText(/Züge:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Neues Spiel/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<HalmaGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
