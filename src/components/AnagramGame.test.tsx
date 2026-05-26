import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnagramGame from './AnagramGame';

beforeEach(() => {
  window.localStorage.clear();
  class StubAudioContext {
    state = 'running';
    currentTime = 0;
    destination = {};
    createOscillator() {
      return {
        type: 'sine',
        frequency: { value: 0, setValueAtTime: () => undefined },
        connect: () => ({ connect: () => undefined }),
        start: () => undefined,
        stop: () => undefined,
      };
    }
    createGain() {
      return {
        gain: {
          value: 0,
          setValueAtTime: () => undefined,
          linearRampToValueAtTime: () => undefined,
          exponentialRampToValueAtTime: () => undefined,
        },
        connect: (t: unknown) => t,
      };
    }
    resume() {
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
  }
  vi.stubGlobal('AudioContext', StubAudioContext);
});

describe('AnagramGame', () => {
  it('renders the status row and letter/solution groups', () => {
    render(<AnagramGame />);
    expect(screen.getByText(/Länge:/)).toBeInTheDocument();
    expect(screen.getByText(/Serie:/)).toBeInTheDocument();
    expect(screen.getByText(/Best:/)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Buchstaben' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Lösung' })).toBeInTheDocument();
  });

  it('places a letter into a solution slot when a tile is tapped', async () => {
    const user = userEvent.setup();
    render(<AnagramGame />);
    const tileGroup = screen.getByRole('group', { name: 'Buchstaben' });
    const tiles = within(tileGroup).getAllByRole('button');
    await user.click(tiles[0]!);
    const solution = screen.getByRole('group', { name: 'Lösung' });
    expect(within(solution).getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('clears placed letters with the "Leeren" button', async () => {
    const user = userEvent.setup();
    render(<AnagramGame />);
    const tileGroup = screen.getByRole('group', { name: 'Buchstaben' });
    await user.click(within(tileGroup).getAllByRole('button')[0]!);
    await user.click(screen.getByRole('button', { name: /Leeren/i }));
    const solution = screen.getByRole('group', { name: 'Lösung' });
    expect(within(solution).queryAllByRole('button')).toHaveLength(0);
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<AnagramGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
