import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import CrosswordGame from './CrosswordGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('CrosswordGame', () => {
  it('renders the grid and clues', () => {
    render(<CrosswordGame />);
    expect(screen.getByRole('group', { name: /Kreuzworträtsel-Gitter/ })).toBeInTheDocument();
    expect(screen.getByText('Waagerecht')).toBeInTheDocument();
    expect(screen.getByText('Senkrecht')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Prüfen/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<CrosswordGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
