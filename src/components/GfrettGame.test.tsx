import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GfrettGame from './GfrettGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('GfrettGame', () => {
  it('renders blocks and the match area with the default level', () => {
    render(<GfrettGame />);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    expect(screen.getByRole('list', { name: /Match-Leiste/i })).toBeInTheDocument();
  });

  it('shows a restart button that resets moves to 0', async () => {
    const user = userEvent.setup();
    render(<GfrettGame />);
    const restart = screen.getByRole('button', { name: /Level neustarten/i });
    await user.click(restart);
    expect(screen.getByText(/Züge:/).textContent).toMatch(/0/);
  });

  it('lists each level in the level select', () => {
    render(<GfrettGame />);
    const select = screen.getByLabelText(/Level:/i) as HTMLSelectElement;
    expect(select.options.length).toBeGreaterThanOrEqual(6);
  });

  it('exposes power-up buttons with remaining counts', () => {
    render(<GfrettGame />);
    expect(screen.getByRole('button', { name: /Rückgängig/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mischen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Leiste \+1/i })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<GfrettGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
