import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import TypingTestGame from './TypingTestGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('TypingTestGame', () => {
  it('renders the HUD and text area', () => {
    render(<TypingTestGame />);
    expect(screen.getByText(/WPM:/)).toBeInTheDocument();
    expect(screen.getByText(/Genauigkeit:/)).toBeInTheDocument();
    expect(screen.getByText(/Zeit:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Neuer Test/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<TypingTestGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
