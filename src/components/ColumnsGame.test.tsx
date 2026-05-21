import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import ColumnsGame from './ColumnsGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('ColumnsGame', () => {
  it('renders the HUD and on-screen control buttons', () => {
    render(<ColumnsGame />);
    expect(screen.getByText(/Punkte:/)).toBeInTheDocument();
    expect(screen.getByText(/Level:/)).toBeInTheDocument();
    expect(screen.getByText(/Best:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nach links/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Farben drehen/ })).toBeInTheDocument();
  });

  it('renders the playing field', () => {
    render(<ColumnsGame />);
    expect(screen.getByRole('group', { name: /Columns-Spielfeld/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<ColumnsGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
