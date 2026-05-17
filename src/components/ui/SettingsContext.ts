import { createContext } from 'react';
import type { UISettings } from '../../lib/persistedSchemas';

export interface SettingsContextValue {
  settings: UISettings;
  setSound: (enabled: boolean) => void;
  setHaptics: (enabled: boolean) => void;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);
