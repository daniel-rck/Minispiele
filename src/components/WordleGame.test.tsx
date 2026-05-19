import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import WordleGame from './WordleGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('WordleGame', () => {
  it('renders six rows of five empty cells and a keyboard', () => {
    render(<WordleGame />);
    // 6 * 5 = 30 grid cells expected
    expect(screen.getAllByRole('gridcell')).toHaveLength(30);
    // Keyboard letter A is rendered (case-insensitive aria-label)
    expect(screen.getByRole('button', { name: /Buchstabe A/i })).toBeInTheDocument();
  });

  it('appends a typed letter into the first empty cell', async () => {
    const user = userEvent.setup();
    render(<WordleGame />);
    await user.click(screen.getByRole('button', { name: /Buchstabe A/i }));
    // The first row's first cell should now contain 'A' as accessible name
    const cells = screen.getAllByRole('gridcell');
    expect(cells[0]?.textContent).toContain('A');
  });

  it('renders Enter and Backspace special keys', () => {
    render(<WordleGame />);
    expect(screen.getByRole('button', { name: /Eingabe absenden/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zeichen löschen/ })).toBeInTheDocument();
  });

  it('flashes an error when submitting too few letters', async () => {
    const user = userEvent.setup();
    render(<WordleGame />);
    await user.click(screen.getByRole('button', { name: /Buchstabe A/i }));
    await user.click(screen.getByRole('button', { name: /Eingabe absenden/ }));
    expect(screen.getByText(/Zu wenig Buchstaben/i)).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<WordleGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
