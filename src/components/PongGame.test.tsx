import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import PongGame from './PongGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('PongGame', () => {
  it('renders the canvas, HUD, and controls', () => {
    render(<PongGame />);
    expect(screen.getByLabelText(/Pong-Spielfeld/)).toBeInTheDocument();
    expect(screen.getByText(/Du:/)).toBeInTheDocument();
    expect(screen.getByText(/PC:/)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<PongGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
