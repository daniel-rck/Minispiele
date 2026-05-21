import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import WuerfelpokerGame from './WuerfelpokerGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('WuerfelpokerGame', () => {
  it('renders the dice and controls', () => {
    render(<WuerfelpokerGame />);
    expect(screen.getByRole('button', { name: /Würfeln/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Würfel 1/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Neue Runde/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<WuerfelpokerGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
