import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import QwirkleGame from './QwirkleGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('QwirkleGame', () => {
  it('renders the board and hand', () => {
    render(<QwirkleGame />);
    expect(screen.getByRole('group', { name: /Qwirkle-Spielbrett/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Deine Hand/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Legen/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<QwirkleGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
