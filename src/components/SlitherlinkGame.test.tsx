import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import SlitherlinkGame from './SlitherlinkGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('SlitherlinkGame', () => {
  it('renders the puzzle and controls', () => {
    render(<SlitherlinkGame />);
    expect(screen.getByRole('group', { name: /Slitherlink-Rätsel/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Neues Rätsel/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<SlitherlinkGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
