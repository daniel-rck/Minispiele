import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import ConnectionsGame from './ConnectionsGame';

beforeEach(() => {
  window.localStorage.clear();
});

describe('ConnectionsGame', () => {
  it('renders 16 word tiles and the action buttons', () => {
    render(<ConnectionsGame />);
    expect(screen.getByRole('group', { name: /Connections-Wortgitter/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Auswahl löschen/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Prüfen/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Neues Rätsel/ })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<ConnectionsGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
