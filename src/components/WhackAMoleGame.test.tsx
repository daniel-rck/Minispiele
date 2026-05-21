import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import WhackAMoleGame from './WhackAMoleGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('WhackAMoleGame', () => {
  it('renders the field and HUD', () => {
    render(<WhackAMoleGame />);
    expect(screen.getByRole('group', { name: /Whack-a-Mole-Feld/ })).toBeInTheDocument();
    expect(screen.getByText(/Punkte:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Neues Spiel/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<WhackAMoleGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
