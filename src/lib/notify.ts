import type { Mode } from '../types';

const MESSAGES: Record<Mode, string> = {
  focus: 'Focus terminé ! Petite pause 🍋',
  short: 'Pause finie — on replante 🍅',
  long: 'Grande pause finie — nouveau cycle 🍅',
};

export const SESSION_DONE_MESSAGE = 'Session terminée — bravo 🎉';

export function requestNotificationPermission(): void {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  } catch {
    /* notifications indisponibles */
  }
}

export function notifyStepDone(mode: Mode, enabled: boolean): void {
  notify(MESSAGES[mode], enabled);
}

export function notify(body: string, enabled: boolean): void {
  if (!enabled) return;
  try {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      new Notification('POMODORO.EXE', { body, silent: true });
    } else if (Notification.permission !== 'denied') {
      void Notification.requestPermission();
    }
  } catch {
    /* notifications indisponibles */
  }
}
