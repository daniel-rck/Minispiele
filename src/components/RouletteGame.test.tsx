import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import RouletteGame from './RouletteGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('RouletteGame', () => {
  it('renders the wheel, chip selector, and bet grid', () => {
    render(<RouletteGame />);
    expect(screen.getByText(/Guthaben:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Drehen/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Einsatzfelder Zahlen/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Außenwetten/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<RouletteGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
