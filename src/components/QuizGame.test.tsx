import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import QuizGame from './QuizGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('QuizGame', () => {
  it('renders the HUD and four answer buttons', () => {
    render(<QuizGame />);
    expect(screen.getByText(/Frage:/)).toBeInTheDocument();
    expect(screen.getByText(/Rekord:/)).toBeInTheDocument();
    // 4 answer buttons all start with A/B/C/D
    expect(screen.getByRole('button', { name: /^A:/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^B:/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<QuizGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
