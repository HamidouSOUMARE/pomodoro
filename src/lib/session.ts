import type { Mode, Settings } from '../types';

/** Durée d'une étape, en secondes. */
export function durationFor(mode: Mode, settings: Settings): number {
  return settings[mode] * 60;
}

/**
 * Pause qui précède le focus n+1 : grande pause tous les `cycles` focus.
 * `focusDone` = nombre de focus déjà terminés.
 */
export function breakAfterFocus(focusDone: number, settings: Settings): Mode {
  return focusDone > 0 && focusDone % settings.cycles === 0 ? 'long' : 'short';
}

/** "25:00", ou "2:35:00" au-delà de l'heure. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
