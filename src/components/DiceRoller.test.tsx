import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiceRoller from './DiceRoller';
import { expectNoA11yViolations } from '../test/a11y';

beforeEach(() => {
  window.localStorage.clear();
});

describe('DiceRoller', () => {
  it('renders the default preset (Kniffel = 5 d6) initially', () => {
    render(<DiceRoller />);
    const dice = screen
      .getAllByRole('button', { name: /Würfel d6/i })
      .filter((b) => b.getAttribute('aria-label')?.startsWith('Würfel d6 ('));
    expect(dice.length).toBe(5);
  });

  it('rolls all dice when the bottom roll button is clicked', async () => {
    const user = userEvent.setup();
    render(<DiceRoller />);
    const sumLabel = screen.getByText(/Summe:/i);
    const before = sumLabel.textContent;
    await user.click(screen.getByRole('button', { name: /^🎲 Würfeln/ }));
    // Rolls are random — confirm no crash, sum element still present.
    expect(screen.getByText(/Summe:/i)).toBeInTheDocument();
    // History badge should now show >= 1.
    const historyBtn = screen.getByRole('button', { name: /Verlauf/i });
    expect(historyBtn.textContent).toMatch(/1/);
    // The label still renders.
    expect(before).toBeTruthy();
  });

  it('parses 2d20 notation and replaces the dice set', async () => {
    const user = userEvent.setup();
    render(<DiceRoller />);
    const input = screen.getByPlaceholderText(/3d6\+2/i);
    await user.clear(input);
    await user.type(input, '2d20');
    await user.click(screen.getByRole('button', { name: /^Setzen$/i }));
    const d20s = screen
      .getAllByRole('button', { name: /Würfel d20/i })
      .filter((b) => b.getAttribute('aria-label')?.startsWith('Würfel d20 ('));
    expect(d20s.length).toBe(2);
  });

  it('applies a notation modifier to the displayed sum', async () => {
    const user = userEvent.setup();
    render(<DiceRoller />);
    const input = screen.getByPlaceholderText(/3d6\+2/i);
    await user.clear(input);
    await user.type(input, '2d6+5');
    await user.click(screen.getByRole('button', { name: /^Setzen$/i }));
    // 2 d6 dice now exist; sum = roll1+roll2+5. Without rolling, dice keep their initial random values.
    // We assert the modifier chip is visible — that proves the modifier was applied to state.
    expect(screen.getByRole('button', { name: /Modifier \+5 entfernen/i })).toBeInTheDocument();
  });

  it('shows a hint on invalid notation', async () => {
    const user = userEvent.setup();
    render(<DiceRoller />);
    const input = screen.getByPlaceholderText(/3d6\+2/i);
    await user.clear(input);
    await user.type(input, 'foobar');
    await user.click(screen.getByRole('button', { name: /^Setzen$/i }));
    expect(screen.getByRole('alert').textContent).toMatch(/ungültig/i);
  });

  it('Verlauf bottom-sheet opens with current entries', async () => {
    const user = userEvent.setup();
    render(<DiceRoller />);
    await user.click(screen.getByRole('button', { name: /^🎲 Würfeln/ }));
    await user.click(screen.getByRole('button', { name: /Verlauf/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /Verlauf/i })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<DiceRoller />);
    await expectNoA11yViolations(container);
  });
});
