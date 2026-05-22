import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import FlappyBirdGame from './FlappyBirdGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('FlappyBirdGame', () => {
  it('renders the canvas and HUD', () => {
    render(<FlappyBirdGame />);
    expect(screen.getByLabelText(/Flappy-Bird-Spielfeld/)).toBeInTheDocument();
    expect(screen.getByText(/Punkte:/)).toBeInTheDocument();
    expect(screen.getByText(/Rekord:/)).toBeInTheDocument();
  });

  it('shows the start overlay', () => {
    render(<FlappyBirdGame />);
    expect(screen.getByText(/FLAPPY BIRD/)).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<FlappyBirdGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
