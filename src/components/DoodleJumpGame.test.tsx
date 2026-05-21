import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import DoodleJumpGame from './DoodleJumpGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('DoodleJumpGame', () => {
  it('renders the canvas, HUD, and touch buttons', () => {
    render(<DoodleJumpGame />);
    expect(screen.getByLabelText(/Doodle-Jump-Spielfeld/)).toBeInTheDocument();
    expect(screen.getByText(/Höhe:/)).toBeInTheDocument();
    expect(screen.getByText(/Best:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nach links/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nach rechts/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<DoodleJumpGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
