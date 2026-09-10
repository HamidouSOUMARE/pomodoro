export type Rarity = 'commune' | 'peu-commune' | 'rare' | 'legendaire';

export type SpeciesId =
  | 'paquerette'
  | 'coquelicot'
  | 'tulipe'
  | 'tournesol'
  | 'lavande'
  | 'cerisier';

/** Nombre de stades de croissance, graine comprise. */
export const STAGE_COUNT = 4;

/** Dernier stade : la plante est arrivée à maturité. */
export const FINAL_STAGE = STAGE_COUNT - 1;

export interface Species {
  id: SpeciesId;
  name: string;
  rarity: Rarity;
  /** prix d'achat de la graine, en rayons */
  seedPrice: number;
  /** coût d'un passage de stade, en rayons */
  growthCost: number;
  /** heures de focus cumulées nécessaires pour débloquer l'espèce */
  unlockHours: number;
  /** libellés des stades, du semis à la maturité */
  stages: readonly [string, string, string, string];
}

export interface Plot {
  species: SpeciesId;
  /** 0 = graine plantée, FINAL_STAGE = épanouie */
  stage: number;
}

export interface GardenState {
  /** monnaie disponible */
  rayons: number;
  /** cumul de focus, en secondes — sert aux paliers */
  focusSeconds: number;
  /** focus terminés d'affilée, remis à zéro si une étape est passée */
  streak: number;
  /** une case par parcelle, null = terre nue */
  plots: (Plot | null)[];
  /** total gagné depuis le début, pour la page de progression */
  lifetimeRayons: number;
  /** plantes menées à maturité puis cueillies, par espèce */
  collection: Partial<Record<SpeciesId, number>>;
}
