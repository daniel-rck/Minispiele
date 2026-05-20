import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DifficultySelector from './DifficultySelector';

type Difficulty = 'easy' | 'medium' | 'hard';

describe('DifficultySelector', () => {
  const options: Record<Difficulty, string> = {
    easy: 'Leicht',
    medium: 'Mittel',
    hard: 'Schwer',
  };

  it('renders the label and current value', () => {
    render(<DifficultySelector<Difficulty> value="medium" options={options} onChange={vi.fn()} />);
    expect(screen.getByText('Schwierigkeit:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('medium');
  });

  it('renders all options from the options record', () => {
    render(<DifficultySelector<Difficulty> value="easy" options={options} onChange={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'Leicht' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Mittel' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Schwer' })).toBeInTheDocument();
  });

  it('calls onChange when a new value is selected', async () => {
    const onChange = vi.fn();
    render(<DifficultySelector<Difficulty> value="easy" options={options} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole('combobox'), 'hard');
    expect(onChange).toHaveBeenCalledWith('hard');
  });

  it('respects a custom label', () => {
    render(
      <DifficultySelector<Difficulty>
        value="easy"
        options={options}
        onChange={vi.fn()}
        label="Niveau:"
      />,
    );
    expect(screen.getByText('Niveau:')).toBeInTheDocument();
  });

  it('disables the select when disabled is true', () => {
    render(
      <DifficultySelector<Difficulty> value="easy" options={options} onChange={vi.fn()} disabled />,
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
