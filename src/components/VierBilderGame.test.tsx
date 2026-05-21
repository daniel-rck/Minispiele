import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import VierBilderGame from './VierBilderGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('VierBilderGame', () => {
  it('renders the emoji grid and letter buttons', () => {
    render(<VierBilderGame />);
    expect(screen.getByRole('group', { name: /Bildhinweise/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Verfügbare Buchstaben/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hinweis/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<VierBilderGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
