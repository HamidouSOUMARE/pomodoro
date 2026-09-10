import { SPECIES, SPECIES_LIST } from './species';
import { FINAL_STAGE, type GardenState, type Species, type SpeciesId } from './types';

/** 1 rayon par minute de focus terminée. */
export const RAYONS_PER_MINUTE = 1;
/** Longueur d'une série récompensée. */
export const STREAK_LENGTH = 3;
export const STREAK_BONUS = 15;
export const SESSION_BONUS = 40;

/** Parcelles débloquées selon les heures de focus cumulées. */
const PLOT_MILESTONES: readonly { hours: number; plots: number }[] = [
  { hours: 0, plots: 2 },
  { hours: 1, plots: 3 },
  { hours: 6, plots: 4 },
  { hours: 20, plots: 5 },
  { hours: 50, plots: 6 },
];

export const MAX_PLOTS = PLOT_MILESTONES[PLOT_MILESTONES.length - 1].plots;

export function focusHours(state: Pick<GardenState, 'focusSeconds'>): number {
  return state.focusSeconds / 3600;
}

export function plotsUnlocked(focusSeconds: number): number {
  const hours = focusSeconds / 3600;
  let plots = PLOT_MILESTONES[0].plots;
  for (const milestone of PLOT_MILESTONES) {
    if (hours >= milestone.hours) plots = milestone.plots;
  }
  return plots;
}

/** Heures de focus nécessaires pour ouvrir la parcelle d'indice donné. */
export function plotUnlockHours(index: number): number {
  const milestone = PLOT_MILESTONES.find((m) => m.plots === index + 1);
  return milestone?.hours ?? 0;
}

export function isSpeciesUnlocked(species: Species, focusSeconds: number): boolean {
  return focusSeconds / 3600 >= species.unlockHours;
}

export interface Milestone {
  hours: number;
  label: string;
}

/** Paliers à venir et déjà franchis, dans l'ordre chronologique. */
export function milestones(): Milestone[] {
  const fromPlots = PLOT_MILESTONES.filter((m) => m.hours > 0).map((m) => ({
    hours: m.hours,
    label: `${m.plots}e parcelle`,
  }));
  const fromSpecies = SPECIES_LIST.filter((s) => s.unlockHours > 0).map((s) => ({
    hours: s.unlockHours,
    label: s.name,
  }));

  // une seule ligne par palier : les especes debloquees ensemble sont regroupees
  const merged = new Map<number, string[]>();
  for (const entry of [...fromPlots, ...fromSpecies].sort((a, b) => a.hours - b.hours)) {
    const labels = merged.get(entry.hours) ?? [];
    if (!labels.includes(entry.label)) labels.push(entry.label);
    merged.set(entry.hours, labels);
  }

  return [...merged.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([hours, labels]) => ({ hours, label: labels.join(' · ') }));
}

/** Prochain palier non atteint, ou null quand tout est débloqué. */
export function nextMilestone(focusSeconds: number): Milestone | null {
  const hours = focusSeconds / 3600;
  return milestones().find((m) => m.hours > hours) ?? null;
}

export interface FocusReward {
  /** rayons gagnés pour la durée du focus */
  base: number;
  /** prime de série, 0 la plupart du temps */
  streakBonus: number;
  total: number;
  /** nouvelle longueur de série */
  streak: number;
}

/** Récompense d'un focus mené à son terme. */
export function rewardForFocus(focusMinutes: number, previousStreak: number): FocusReward {
  const base = Math.max(0, Math.round(focusMinutes * RAYONS_PER_MINUTE));
  const streak = previousStreak + 1;
  const streakBonus = streak % STREAK_LENGTH === 0 ? STREAK_BONUS : 0;
  return { base, streakBonus, total: base + streakBonus, streak };
}

export function canBuy(species: Species, state: GardenState): boolean {
  return (
    state.rayons >= species.seedPrice &&
    isSpeciesUnlocked(species, state.focusSeconds) &&
    state.plots.slice(0, plotsUnlocked(state.focusSeconds)).some((plot) => plot === null)
  );
}

/** Coût du passage au stade suivant, ou null si la plante est à maturité. */
export function growthCostFor(speciesId: SpeciesId, stage: number): number | null {
  if (stage >= FINAL_STAGE) return null;
  return SPECIES[speciesId].growthCost;
}

export const EMPTY_GARDEN: GardenState = {
  rayons: 0,
  focusSeconds: 0,
  streak: 0,
  plots: Array.from({ length: MAX_PLOTS }, () => null),
  lifetimeRayons: 0,
  collection: {},
};
