import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import FutoshikiGame from './FutoshikiGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('FutoshikiGame', () => {
  it('renders the grid and number pad', () => {
    render(<FutoshikiGame />);
    expect(screen.getByRole('group', { name: /Futoshiki-Spielfeld/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zahl 1/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zelle leeren/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<FutoshikiGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
