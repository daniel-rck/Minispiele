import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import QuizGame from './QuizGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('QuizGame', () => {
  it('renders the HUD and four answer buttons in classic mode by default', () => {
    render(<QuizGame />);
    expect(screen.getByText(/Frage:/)).toBeInTheDocument();
    expect(screen.getByText(/Rekord:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^A:/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^B:/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^50:50$/ })).not.toBeInTheDocument();
  });

  it('exposes the mode toggle with classic active by default', () => {
    render(<QuizGame />);
    expect(screen.getByRole('button', { name: 'Klassisch' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Millionär' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('switches to millionaire mode and renders jokers and prize pyramid', async () => {
    const user = userEvent.setup();
    render(<QuizGame />);
    await user.click(screen.getByRole('button', { name: 'Millionär' }));

    expect(screen.getByRole('button', { name: /^50:50$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Publikum$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Telefon$/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Gewinnpyramide/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Millionär' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Klassisch' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('switches back from millionaire to classic via the toggle', async () => {
    const user = userEvent.setup();
    render(<QuizGame />);
    await user.click(screen.getByRole('button', { name: 'Millionär' }));
    expect(screen.getByRole('button', { name: /^50:50$/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Klassisch' }));
    expect(screen.queryByRole('button', { name: /^50:50$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /Gewinnpyramide/ })).not.toBeInTheDocument();
  });

  it('hides two answers after using the 50:50 joker', async () => {
    const user = userEvent.setup();
    render(<QuizGame />);
    await user.click(screen.getByRole('button', { name: 'Millionär' }));

    const enabledAnswers = () =>
      screen
        .getAllByRole('button', { name: /^[ABCD]:/ })
        .filter((b) => !(b as HTMLButtonElement).disabled);
    expect(enabledAnswers()).toHaveLength(4);

    await user.click(screen.getByRole('button', { name: /^50:50$/ }));
    expect(enabledAnswers()).toHaveLength(2);
    expect(screen.getByRole('button', { name: /^50:50$/ })).toBeDisabled();
  });

  it('passes axe-core checks on default (classic) render', async () => {
    const { container } = render(<QuizGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });

  it('passes axe-core checks in millionaire mode', async () => {
    const user = userEvent.setup();
    const { container } = render(<QuizGame />);
    await user.click(screen.getByRole('button', { name: 'Millionär' }));
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
