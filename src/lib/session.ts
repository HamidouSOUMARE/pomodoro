import type { Mode, Settings } from '../types';

/** Plan calculé pour une enveloppe de session donnée. */
export interface SessionPlan {
  /** nombre de focus qui tiennent entièrement dans l'enveloppe */
  focusCount: number;
  /** nombre de pauses intercalées entre ces focus */
  breakCount: number;
  /** durée réellement planifiée, en secondes (<= enveloppe) */
  plannedSeconds: number;
  /** enveloppe demandée, en secondes */
  budgetSeconds: number;
}

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

/**
 * Répartit l'enveloppe de session en focus + pauses.
 * Renvoie `null` quand la session n'est pas limitée.
 */
export function planSession(settings: Settings): SessionPlan | null {
  if (settings.sessionLimit <= 0) return null;

  const budgetSeconds = settings.sessionLimit * 60;
  const focusSeconds = durationFor('focus', settings);

  let plannedSeconds = 0;
  let focusCount = 0;
  let breakCount = 0;

  for (;;) {
    const pause = focusCount === 0 ? 0 : durationFor(breakAfterFocus(focusCount, settings), settings);
    if (plannedSeconds + pause + focusSeconds > budgetSeconds) break;

    plannedSeconds += pause + focusSeconds;
    focusCount += 1;
    if (pause > 0) breakCount += 1;
  }

  return { focusCount, breakCount, plannedSeconds, budgetSeconds };
}

/** "1 h 25", "45 min", "2 h" — format court pour l'affichage. */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return 'illimité';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, '0')}`;
}

/**
 * "25:00", ou "2:35:00" au-delà de l'heure.
 * `forceHours` aligne deux horloges affichees côte à côte.
 */
export function formatClock(totalSeconds: number, forceHours = false): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0 || forceHours) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Phrase récapitulative affichée sous le réglage de durée de session. */
export function describePlan(plan: SessionPlan | null, settings: Settings): string {
  if (!plan) return 'Session illimitée : les cycles s\'enchaînent sans limite de temps.';
  if (plan.focusCount === 0) {
    return `Trop court pour un focus de ${settings.focus} min — augmente la durée totale.`;
  }
  const focusPart = `${plan.focusCount} focus de ${settings.focus} min`;
  const breakPart =
    plan.breakCount === 0
      ? 'sans pause'
      : `avec ${plan.breakCount} pause${plan.breakCount > 1 ? 's' : ''}`;
  return `${focusPart}, ${breakPart} — ${formatMinutes(Math.round(plan.plannedSeconds / 60))} au total.`;
}
