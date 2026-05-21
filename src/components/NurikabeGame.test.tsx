import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import NurikabeGame from './NurikabeGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('NurikabeGame', () => {
  it('renders the grid and controls', () => {
    render(<NurikabeGame />);
    expect(screen.getByRole('group', { name: /Nurikabe-Spielfeld/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Neues Rätsel/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Prüfen/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<NurikabeGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
