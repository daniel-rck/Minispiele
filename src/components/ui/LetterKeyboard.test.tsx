import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LetterKeyboard, { type LetterStatus } from './LetterKeyboard';

describe('LetterKeyboard', () => {
  it('renders all 26 default letters as buttons', () => {
    render(<LetterKeyboard status={{}} onLetter={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(26);
    expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Z' })).toBeInTheDocument();
  });

  it('uses a custom alphabet when provided', () => {
    render(<LetterKeyboard alphabet={['Ä', 'Ö', 'Ü']} status={{}} onLetter={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Ä' })).toBeInTheDocument();
  });

  it('calls onLetter when a key is clicked', async () => {
    const onLetter = vi.fn();
    render(<LetterKeyboard status={{}} onLetter={onLetter} />);
    await userEvent.click(screen.getByRole('button', { name: 'A' }));
    expect(onLetter).toHaveBeenCalledWith('A');
  });

  it('disables keys with a status', () => {
    const status: Record<string, LetterStatus> = { A: 'correct', B: 'wrong' };
    render(<LetterKeyboard status={status} onLetter={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'A' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'B' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'C' })).not.toBeDisabled();
  });

  it('disables all keys when disabled prop is set', () => {
    render(<LetterKeyboard status={{}} onLetter={vi.fn()} disabled />);
    expect(screen.getByRole('button', { name: 'A' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Z' })).toBeDisabled();
  });

  it('uses a custom group label', () => {
    render(<LetterKeyboard status={{}} onLetter={vi.fn()} label="Mein Alphabet" />);
    expect(screen.getByRole('group', { name: 'Mein Alphabet' })).toBeInTheDocument();
  });
});
