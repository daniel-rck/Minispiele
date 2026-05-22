import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import AsteroidsGame from './AsteroidsGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('AsteroidsGame', () => {
  it('renders the canvas and HUD', () => {
    render(<AsteroidsGame />);
    expect(screen.getByLabelText(/Asteroids-Spielfeld/)).toBeInTheDocument();
    expect(screen.getByText(/Punkte:/)).toBeInTheDocument();
    expect(screen.getByText(/Best:/)).toBeInTheDocument();
  });

  it('renders the on-screen control buttons', () => {
    render(<AsteroidsGame />);
    expect(screen.getByRole('button', { name: /Nach links/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Schub/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nach rechts/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Schießen/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<AsteroidsGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
