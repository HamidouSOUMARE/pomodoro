import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSettings, saveSettings } from './storage';
import { DEFAULT_SETTINGS } from '../types';

const store = new Map<string, string>();

vi.stubGlobal('window', {
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  },
});

describe('loadSettings', () => {
  beforeEach(() => store.clear());

  it('retombe sur les valeurs par défaut sans données', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('ignore un JSON corrompu', () => {
    store.set('pomodoro-settings', '{oops');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('borne les valeurs hors limites', () => {
    saveSettings({ ...DEFAULT_SETTINGS, focus: 999, vol: 12 });
    const loaded = loadSettings();
    expect(loaded.focus).toBe(120);
    expect(loaded.vol).toBe(1);
  });

  it('ne restaure pas un son importé, perdu au redémarrage', () => {
    saveSettings({ ...DEFAULT_SETTINGS, sound: 'custom' });
    expect(loadSettings().sound).toBe('bell');
  });
});
