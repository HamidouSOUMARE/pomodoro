import { DEFAULT_SETTINGS, LIMITS, type Settings } from '../types';

const STORAGE_KEY = 'pomodoro-settings';

function clamp(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Relit les réglages persistés en validant chaque champ. */
export function loadSettings(): Settings {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (!raw) return DEFAULT_SETTINGS;

  let parsed: Partial<Settings>;
  try {
    parsed = JSON.parse(raw) as Partial<Settings>;
  } catch {
    return DEFAULT_SETTINGS;
  }

  const volume = Number(parsed.vol);

  return {
    focus: clamp(parsed.focus, DEFAULT_SETTINGS.focus, LIMITS.focus.min, LIMITS.focus.max),
    short: clamp(parsed.short, DEFAULT_SETTINGS.short, LIMITS.short.min, LIMITS.short.max),
    long: clamp(parsed.long, DEFAULT_SETTINGS.long, LIMITS.long.min, LIMITS.long.max),
    cycles: clamp(parsed.cycles, DEFAULT_SETTINGS.cycles, LIMITS.cycles.min, LIMITS.cycles.max),
    auto: typeof parsed.auto === 'boolean' ? parsed.auto : DEFAULT_SETTINGS.auto,
    notif: typeof parsed.notif === 'boolean' ? parsed.notif : DEFAULT_SETTINGS.notif,
    // un son importé ne survit pas au redémarrage : on retombe sur la cloche
    sound: parsed.sound && parsed.sound !== 'custom' ? parsed.sound : DEFAULT_SETTINGS.sound,
    vol: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : DEFAULT_SETTINGS.vol,
  };
}

export function saveSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* mode privé ou quota plein : on garde les réglages en mémoire */
  }
}
