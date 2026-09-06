import { useCallback, useState } from 'react';
import { loadSettings, saveSettings } from '../lib/storage';
import type { Settings } from '../types';

export interface UseSettings {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

/** Réglages persistés dans le localStorage, validés à la lecture. */
export function useSettings(): UseSettings {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((previous) => {
      const next = { ...previous, [key]: value };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, update };
}
