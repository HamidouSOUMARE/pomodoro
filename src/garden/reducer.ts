import {
  EMPTY_GARDEN,
  canBuy,
  growthCostFor,
  plotsUnlocked,
  rewardForFocus,
  SESSION_BONUS,
  type FocusReward,
} from './economy';
import { SPECIES } from './species';
import { FINAL_STAGE, type GardenState, type SpeciesId } from './types';

/**
 * Transitions pures du jardin : chaque fonction renvoie un nouvel état et ne
 * touche à rien d'autre, ce qui les rend testables sans React ni navigateur.
 */

export interface FocusOutcome {
  state: GardenState;
  reward: FocusReward;
}

/** Un focus vient d'être mené à son terme. */
export function grantFocus(state: GardenState, focusMinutes: number): FocusOutcome {
  const reward = rewardForFocus(focusMinutes, state.streak);
  return {
    reward,
    state: {
      ...state,
      rayons: state.rayons + reward.total,
      lifetimeRayons: state.lifetimeRayons + reward.total,
      focusSeconds: state.focusSeconds + Math.round(focusMinutes * 60),
      streak: reward.streak,
    },
  };
}

/** L'enveloppe de session a été bouclée entièrement. */
export function grantSessionBonus(state: GardenState): GardenState {
  return {
    ...state,
    rayons: state.rayons + SESSION_BONUS,
    lifetimeRayons: state.lifetimeRayons + SESSION_BONUS,
  };
}

/** Étape passée ou réinitialisée : la série tombe. */
export function breakStreak(state: GardenState): GardenState {
  return state.streak === 0 ? state : { ...state, streak: 0 };
}

/**
 * Sème une graine dans la première parcelle libre.
 * Renvoie l'état inchangé si l'achat n'est pas possible.
 */
export function plantSeed(state: GardenState, speciesId: SpeciesId): GardenState {
  const species = SPECIES[speciesId];
  if (!canBuy(species, state)) return state;

  const available = plotsUnlocked(state.focusSeconds);
  const index = state.plots.findIndex((plot, i) => i < available && plot === null);
  if (index === -1) return state;

  const plots = [...state.plots];
  plots[index] = { species: speciesId, stage: 0 };

  return { ...state, rayons: state.rayons - species.seedPrice, plots };
}

/** Fait passer une plante au stade suivant, contre des rayons. */
export function growPlant(state: GardenState, plotIndex: number): GardenState {
  const plot = state.plots[plotIndex];
  if (!plot) return state;

  const cost = growthCostFor(plot.species, plot.stage);
  if (cost === null || state.rayons < cost) return state;

  const plots = [...state.plots];
  plots[plotIndex] = { ...plot, stage: plot.stage + 1 };

  return { ...state, rayons: state.rayons - cost, plots };
}

/**
 * Cueille une plante arrivée à maturité : elle rejoint la collection et libère
 * la parcelle. Une plante encore en croissance ne peut pas être cueillie.
 */
export function harvestPlant(state: GardenState, plotIndex: number): GardenState {
  const plot = state.plots[plotIndex];
  if (!plot || plot.stage !== FINAL_STAGE) return state;

  const plots = [...state.plots];
  plots[plotIndex] = null;

  return {
    ...state,
    plots,
    collection: {
      ...state.collection,
      [plot.species]: (state.collection[plot.species] ?? 0) + 1,
    },
  };
}

/** Nombre total de plantes cueillies. */
export function collectionSize(state: GardenState): number {
  return Object.values(state.collection).reduce((sum, count) => sum + (count ?? 0), 0);
}

/* ---------- banc d'essai ---------- */

/** Crédite des rayons sans passer par le minuteur. */
export function grantRayons(state: GardenState, amount: number): GardenState {
  const gain = Math.max(0, Math.round(amount));
  if (gain === 0) return state;
  return {
    ...state,
    rayons: state.rayons + gain,
    lifetimeRayons: state.lifetimeRayons + gain,
  };
}

/** Avance le compteur de focus, pour atteindre un palier sans l'attendre. */
export function addFocusTime(state: GardenState, seconds: number): GardenState {
  const extra = Math.max(0, Math.round(seconds));
  if (extra === 0) return state;
  return { ...state, focusSeconds: state.focusSeconds + extra };
}

/** Repart d'un jardin vierge. */
export function resetGarden(): GardenState {
  return { ...EMPTY_GARDEN, plots: EMPTY_GARDEN.plots.map(() => null), collection: {} };
}

export function isMature(state: GardenState, plotIndex: number): boolean {
  return state.plots[plotIndex]?.stage === FINAL_STAGE;
}
