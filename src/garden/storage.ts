import { EMPTY_GARDEN, MAX_PLOTS } from './economy';
import { SPECIES } from './species';
import { FINAL_STAGE, type GardenState, type Plot, type SpeciesId } from './types';

const STORAGE_KEY = 'pomodoro-jardin';

function positiveInt(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function readPlot(value: unknown): Plot | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<Plot>;
  if (typeof raw.species !== 'string' || !(raw.species in SPECIES)) return null;
  const stage = positiveInt(raw.stage, 0);
  return { species: raw.species, stage: Math.min(stage, FINAL_STAGE) };
}

function readCollection(value: unknown): Partial<Record<SpeciesId, number>> {
  if (!value || typeof value !== 'object') return {};
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([id]) => id in SPECIES)
    .map(([id, count]) => [id, positiveInt(count, 0)] as const)
    .filter(([, count]) => count > 0);
  return Object.fromEntries(entries);
}

/** Relit le jardin en validant chaque champ : une sauvegarde abîmée ne casse pas l'app. */
export function loadGarden(): GardenState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY_GARDEN;
  }
  if (!raw) return EMPTY_GARDEN;

  let parsed: Partial<GardenState>;
  try {
    parsed = JSON.parse(raw) as Partial<GardenState>;
  } catch {
    return EMPTY_GARDEN;
  }

  const plots = Array.isArray(parsed.plots) ? parsed.plots : [];
  const rayons = positiveInt(parsed.rayons, 0);

  return {
    rayons,
    focusSeconds: positiveInt(parsed.focusSeconds, 0),
    streak: positiveInt(parsed.streak, 0),
    lifetimeRayons: Math.max(rayons, positiveInt(parsed.lifetimeRayons, rayons)),
    plots: Array.from({ length: MAX_PLOTS }, (_, i) => readPlot(plots[i])),
    collection: readCollection(parsed.collection),
  };
}

export function saveGarden(state: GardenState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* mode privé ou quota plein : le jardin vit en mémoire pour cette session */
  }
}
