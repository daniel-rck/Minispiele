import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TangramGame from './TangramGame';

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

describe('TangramGame', () => {
  it('renders the playing surface and seven rotate buttons', () => {
    render(<TangramGame />);
    expect(screen.getByRole('application', { name: /Tangram/i })).toBeInTheDocument();
    const rotateGroup = screen.getByRole('group', { name: /Teil drehen/i });
    expect(within(rotateGroup).getAllByRole('button')).toHaveLength(7);
  });

  it('toggles the solution overlay button label and pressed state', async () => {
    const user = userEvent.setup();
    render(<TangramGame />);
    const toggle = screen.getByRole('button', { name: /Lösung zeigen/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    const pressed = screen.getByRole('button', { name: /Lösung an/i });
    expect(pressed).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the controls available after pressing "Zurücksetzen"', async () => {
    const user = userEvent.setup();
    render(<TangramGame />);
    await user.click(screen.getByRole('button', { name: /Zurücksetzen/i }));
    expect(screen.getByRole('button', { name: /Nächste Form/i })).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<TangramGame />);
    await act(async () => {
      await Promise.resolve();
    });
    const { expectNoA11yViolations } = await import('../test/a11y');
    await expectNoA11yViolations(container);
  });
});
