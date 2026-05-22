import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import KniffelGame from './KniffelGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('KniffelGame', () => {
  it('renders the dice, roll button, and scorecard', () => {
    render(<KniffelGame />);
    expect(screen.getByRole('button', { name: /Würfeln/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Würfel 1/ })).toBeInTheDocument();
    expect(screen.getByText(/Einser/)).toBeInTheDocument();
    expect(screen.getByText(/Kniffel/)).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<KniffelGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
