import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import GameOverSheet from './GameOverSheet';

describe('GameOverSheet', () => {
  const noop = vi.fn();
  const noopAction = { label: 'Nochmal', onClick: noop };

  it('does not render when closed', () => {
    render(
      <GameOverSheet open={false} onClose={noop} title="Gewonnen!" primaryAction={noopAction} />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title, emoji, message, and primary action when open', () => {
    render(
      <GameOverSheet
        open
        onClose={noop}
        title="Spiel vorbei"
        emoji="🐍"
        message="Du hast 42 Punkte erreicht."
        primaryAction={{ label: 'Nochmal spielen', onClick: noop }}
      />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Spiel vorbei' })).toBeInTheDocument();
    expect(screen.getByText('🐍')).toBeInTheDocument();
    expect(screen.getByText('Du hast 42 Punkte erreicht.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nochmal spielen' })).toBeInTheDocument();
  });

  it('shows the record badge when isNewRecord is true', () => {
    render(
      <GameOverSheet
        open
        onClose={noop}
        title="Gewonnen!"
        isNewRecord
        primaryAction={{ label: 'Weiter', onClick: noop }}
      />,
    );
    expect(screen.getByText('Neue Bestmarke!')).toBeInTheDocument();
  });

  it('uses a custom recordLabel when provided', () => {
    render(
      <GameOverSheet
        open
        onClose={noop}
        title="Gewonnen!"
        isNewRecord
        recordLabel="Neue Bestzeit!"
        primaryAction={{ label: 'Weiter', onClick: noop }}
      />,
    );
    expect(screen.getByText('Neue Bestzeit!')).toBeInTheDocument();
    expect(screen.queryByText('Neue Bestmarke!')).not.toBeInTheDocument();
  });

  it('renders stats as a definition list', () => {
    render(
      <GameOverSheet
        open
        onClose={noop}
        title="Gewonnen!"
        stats={[
          { label: 'Spiele', value: 12 },
          { label: 'Serie', value: 5 },
        ]}
        primaryAction={{ label: 'Weiter', onClick: noop }}
      />,
    );
    expect(screen.getByText('Spiele')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Serie')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls primaryAction.onClick when primary button is clicked', async () => {
    const onPrimary = vi.fn();
    render(
      <GameOverSheet
        open
        onClose={noop}
        title="Gewonnen!"
        primaryAction={{ label: 'Nochmal', onClick: onPrimary }}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Nochmal' }));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it('renders and triggers secondaryAction when provided', async () => {
    const onSecondary = vi.fn();
    render(
      <GameOverSheet
        open
        onClose={noop}
        title="Gewonnen!"
        primaryAction={noopAction}
        secondaryAction={{ label: 'Statistik', onClick: onSecondary }}
      />,
    );
    const btn = screen.getByRole('button', { name: 'Statistik' });
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });
});
