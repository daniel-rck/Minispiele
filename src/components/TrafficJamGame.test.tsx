import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrafficJamGame from './TrafficJamGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('TrafficJamGame', () => {
  it('renders the red target car with an accessible label', () => {
    render(<TrafficJamGame />);
    expect(screen.getByRole('button', { name: /Rotes Zielauto/i })).toBeInTheDocument();
  });

  it('marks a car as selected after clicking it (aria-pressed)', async () => {
    const user = userEvent.setup();
    render(<TrafficJamGame />);
    const target = screen.getByRole('button', { name: /Rotes Zielauto/i });
    expect(target).toHaveAttribute('aria-pressed', 'false');
    await user.click(target);
    expect(target).toHaveAttribute('aria-pressed', 'true');
  });

  it('changes difficulty via the select and rebuilds the board', async () => {
    const user = userEvent.setup();
    render(<TrafficJamGame />);
    const select = screen.getByLabelText(/Schwierigkeit/i);
    await user.selectOptions(select, 'hard');
    // After difficulty change the red car is still on the board (different puzzle).
    expect(screen.getByRole('button', { name: /Rotes Zielauto/i })).toBeInTheDocument();
  });

  it('shows the puzzle counter (Rätsel X / N)', () => {
    render(<TrafficJamGame />);
    expect(screen.getByText(/R.tsel\s+1\s*\/\s*\d+/)).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<TrafficJamGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
