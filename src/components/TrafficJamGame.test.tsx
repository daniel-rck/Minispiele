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

  it('clicking a blocking car drives it out of the way (increments Klicks)', async () => {
    const user = userEvent.setup();
    render(<TrafficJamGame />);
    // easy-01 starts with: A target + C vertical at col 3. Clicking C drives it down.
    const klicksRow = screen.getByText(/Klicks/i).parentElement;
    // initial count is 0
    expect(klicksRow?.textContent ?? '').toContain('0');
    const carC = screen.getByRole('button', { name: /Auto C/i });
    await user.click(carC);
    expect(klicksRow?.textContent ?? '').toContain('1');
  });

  it('changes difficulty via the select and rebuilds the board', async () => {
    const user = userEvent.setup();
    render(<TrafficJamGame />);
    const select = screen.getByLabelText(/Schwierigkeit/i);
    await user.selectOptions(select, 'hard');
    expect(screen.getByRole('button', { name: /Rotes Zielauto/i })).toBeInTheDocument();
  });

  it('shows the puzzle counter (Rätsel X / N)', () => {
    render(<TrafficJamGame />);
    expect(screen.getByText(/R.tsel\s+1\s*\/\s*\d+/)).toBeInTheDocument();
  });

  it('exposes each car´s facing direction in its accessible label', () => {
    render(<TrafficJamGame />);
    const target = screen.getByRole('button', { name: /Rotes Zielauto/i });
    expect(target.getAttribute('aria-label') ?? '').toMatch(/rechts/i);
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
