import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import ViergewinntGame from './ViergewinntGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('ViergewinntGame', () => {
  it('renders the board and controls', () => {
    render(<ViergewinntGame />);
    expect(screen.getByRole('group', { name: /4-Gewinnt-Spielbrett/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Neues Spiel/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gegen KI|2 Spieler/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<ViergewinntGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
