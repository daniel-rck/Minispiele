import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import FroggerGame from './FroggerGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('FroggerGame', () => {
  it('renders the canvas, HUD, and directional buttons', () => {
    render(<FroggerGame />);
    expect(screen.getByLabelText(/Frogger-Spielfeld/)).toBeInTheDocument();
    expect(screen.getByText(/Punkte:/)).toBeInTheDocument();
    expect(screen.getByText(/Leben:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nach oben/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nach unten/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<FroggerGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
