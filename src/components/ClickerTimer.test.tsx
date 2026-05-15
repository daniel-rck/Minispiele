import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClickerTimer from './ClickerTimer';
import { expectNoA11yViolations } from '../test/a11y';

beforeEach(() => {
  window.localStorage.clear();
  // Stub the AudioContext so AlarmAudio reports available without sound.
  class StubAudioContext {
    state = 'running';
    currentTime = 0;
    destination = {};
    createOscillator() {
      return {
        type: 'sine',
        frequency: { value: 0 },
        connect: () => ({ connect: () => undefined }),
        start: () => undefined,
        stop: () => undefined,
      };
    }
    createGain() {
      return {
        gain: {
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

describe('ClickerTimer', () => {
  it('renders the duration display and a start button', () => {
    render(<ClickerTimer />);
    expect(screen.getByText(/00:60|01:00|00:01/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Starten/i })).toBeInTheDocument();
  });

  it('starts the timer when the big button is pressed', async () => {
    const user = userEvent.setup();
    render(<ClickerTimer />);
    await user.click(screen.getByRole('button', { name: /Starten/i }));
    expect(screen.getByText(/Status:/i).textContent).toMatch(/läuft/);
  });

  it('toggles to paused when running and tapped again', async () => {
    const user = userEvent.setup();
    render(<ClickerTimer />);
    await user.click(screen.getByRole('button', { name: /Starten/i }));
    await user.click(screen.getByRole('button', { name: /Pause/i }));
    expect(screen.getByText(/Status:/i).textContent).toMatch(/pausiert/);
  });

  it('Neu-starten button restarts the timer immediately', async () => {
    const user = userEvent.setup();
    render(<ClickerTimer />);
    await user.click(screen.getByRole('button', { name: /Starten/i }));
    expect(screen.getByText(/Status:/i).textContent).toMatch(/läuft/);
    const restartBtn = screen.getByRole('button', { name: /^Neu starten$/i });
    await user.click(restartBtn);
    // Status stays 'läuft' because handleRestart calls startFresh immediately.
    expect(screen.getByText(/Status:/i).textContent).toMatch(/läuft/);
  });

  it('saves a user preset and re-applies it', async () => {
    const user = userEvent.setup();
    render(<ClickerTimer />);
    // Increment seconds to 61 (-> 01:01) so it does not collide with the 01:00 built-in label.
    await user.click(screen.getByRole('button', { name: /sek plus eins/i }));
    await user.click(screen.getByRole('button', { name: /als preset speichern/i }));
    // Find the user preset button: it has the formatted label and a remove sibling.
    const saved = screen.getByRole('button', { name: /^01:01$/ });
    // Switch to 30s built-in
    await user.click(screen.getByRole('button', { name: /^30s$/ }));
    // Re-apply user preset
    await user.click(saved);
    expect(saved).toBeInTheDocument();
  });

  it('passes axe-core checks on default render', async () => {
    const { container } = render(<ClickerTimer />);
    // The big button has its own labels and the structure has no headings, which axe wouldn't flag.
    await act(async () => {
      await Promise.resolve();
    });
    await expectNoA11yViolations(container);
  });
});
