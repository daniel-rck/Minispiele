import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import HelicopterGame from './HelicopterGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('HelicopterGame', () => {
  it('renders the canvas and HUD', () => {
    render(<HelicopterGame />);
    expect(screen.getByLabelText(/Helikopter-Spielfeld/)).toBeInTheDocument();
    expect(screen.getByText(/Distanz:/)).toBeInTheDocument();
    expect(screen.getByText(/Best:/)).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<HelicopterGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
