import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import MillionaerGame from './MillionaerGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('MillionaerGame', () => {
  it('renders the question, answers, and jokers', () => {
    render(<MillionaerGame />);
    expect(screen.getByText(/Frage:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /50:50/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Publikum/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Telefon/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<MillionaerGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
