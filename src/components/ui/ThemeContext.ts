import { createContext } from 'react';
import type { ThemeMode } from '../../lib/persistedSchemas';

export interface ThemeContextValue {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (m: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
