import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import ConwayBattleGame from './ConwayBattleGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('ConwayBattleGame', () => {
  it('renders the HUD and start button', () => {
    render(<ConwayBattleGame />);
    expect(screen.getByText(/Blau:/)).toBeInTheDocument();
    expect(screen.getByText(/Rot:/)).toBeInTheDocument();
    expect(screen.getByText(/Generation:/)).toBeInTheDocument();
    expect(screen.getByText(/Budget:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Schlacht starten/ })).toBeInTheDocument();
  });

  it('renders the playing field', () => {
    render(<ConwayBattleGame />);
    expect(screen.getByRole('group', { name: /Conway-Battle-Spielfeld/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<ConwayBattleGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
