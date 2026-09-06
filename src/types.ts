export type Mode = 'focus' | 'short' | 'long';

export type SoundName = 'bell' | 'marimba' | 'ding' | 'chirp' | 'custom';

export interface Settings {
  /** durée d'un focus, en minutes */
  focus: number;
  /** durée d'une pause courte, en minutes */
  short: number;
  /** durée d'une grande pause, en minutes */
  long: number;
  /** nombre de focus avant la grande pause */
  cycles: number;
  /** enchaîner automatiquement les étapes */
  auto: boolean;
  /** notification système en fin d'étape */
  notif: boolean;
  sound: SoundName;
  /** volume entre 0 et 1 */
  vol: number;
}

export const DEFAULT_SETTINGS: Settings = {
  focus: 25,
  short: 5,
  long: 15,
  cycles: 4,
  auto: true,
  notif: false,
  sound: 'bell',
  vol: 0.7,
};

/** Bornes appliquées à la saisie, partagees entre l'UI et la persistance. */
export const LIMITS = {
  focus: { min: 1, max: 120 },
  short: { min: 1, max: 60 },
  long: { min: 1, max: 90 },
  cycles: { min: 2, max: 8 },
} as const;
