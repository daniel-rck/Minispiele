import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import BinairoGame from './BinairoGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('BinairoGame', () => {
  it('renders the size selector and grid', () => {
    render(<BinairoGame />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Binairo-Rätsel/i })).toBeInTheDocument();
  });

  it('exposes the new-puzzle and check buttons', () => {
    render(<BinairoGame />);
    expect(screen.getByRole('button', { name: /Neues Rätsel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Prüfen/i })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<BinairoGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
