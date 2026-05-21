import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, it } from 'vitest';
import { SettingsProvider } from '../lib/useSettings';
import Home from '../pages/Home';
import { expectNoA11yViolations } from '../test/a11y';
import DiceRoller from './DiceRoller';
import GameLayout from './GameLayout';
import MemoryGame from './MemoryGame';
import RingSortGame from './RingSortGame';
import SettingsSheet from './SettingsSheet';

beforeEach(() => {
  window.localStorage.clear();
});

function renderWithProviders(ui: React.ReactElement, route = '/') {
  return render(
    <SettingsProvider>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </SettingsProvider>,
  );
}

describe('a11y smoke', () => {
  it('Home is free of axe violations', async () => {
    const { container } = renderWithProviders(<Home />);
    await expectNoA11yViolations(container);
  });

  it('GameLayout with RingSortGame is free of axe violations', async () => {
    const { container } = renderWithProviders(
      <GameLayout title="Ringe sortieren" description="Test">
        <RingSortGame />
      </GameLayout>,
      '/ring-sort',
    );
    await expectNoA11yViolations(container);
  });

  it('DiceRoller is free of axe violations on default render', async () => {
    const { container } = renderWithProviders(<DiceRoller />, '/dice');
    await expectNoA11yViolations(container);
  });

  it('MemoryGame is free of axe violations on default render', async () => {
    const { container } = renderWithProviders(<MemoryGame />, '/memory');
    await expectNoA11yViolations(container);
  });

  it('SettingsSheet is free of axe violations when open', async () => {
    const { container } = renderWithProviders(<SettingsSheet open onClose={() => undefined} />);
    await expectNoA11yViolations(container);
  });
});
