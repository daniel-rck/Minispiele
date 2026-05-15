import { useCallback, useEffect, useRef, useState } from 'react';
import type { ZodType } from 'zod';

type SetValue<T> = T | ((prev: T) => T);

export function useLocalStorage<T>(
  key: string,
  schema: ZodType<T>,
  fallback: T,
): [T, (value: SetValue<T>) => void] {
  const [value, setValueState] = useState<T>(() => readFromStorage(key, schema, fallback));
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      // QuotaExceeded, SecurityError (private mode), etc. — swallow, never crash.
      console.warn(`useLocalStorage[${key}]: write failed`, err);
    }
  }, [key, value]);

  const setValue = useCallback((next: SetValue<T>) => {
    setValueState((prev) => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next));
  }, []);

  return [value, setValue];
}

function readFromStorage<T>(key: string, schema: ZodType<T>, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}
