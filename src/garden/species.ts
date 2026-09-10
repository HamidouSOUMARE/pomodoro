import type { Rarity, Species, SpeciesId } from './types';
import { FINAL_STAGE } from './types';

/**
 * Catalogue des graines.
 *
 * L'échelle est calée sur une session type de 3 h (5 focus de 25 min), qui
 * rapporte environ 180 rayons : la première fleur s'obtient en une demi-session,
 * le cerisier demande une bonne semaine de travail régulier.
 */
export const SPECIES: Record<SpeciesId, Species> = {
  paquerette: {
    id: 'paquerette',
    name: 'Pâquerette',
    rarity: 'commune',
    seedPrice: 30,
    growthCost: 12,
    unlockHours: 0,
    stages: ['Graine semée', 'Pousse', 'Bouton', 'Fleurie'],
  },
  coquelicot: {
    id: 'coquelicot',
    name: 'Coquelicot',
    rarity: 'commune',
    seedPrice: 45,
    growthCost: 18,
    unlockHours: 0,
    stages: ['Graine semée', 'Pousse', 'Bouton', 'Fleuri'],
  },
  tulipe: {
    id: 'tulipe',
    name: 'Tulipe',
    rarity: 'peu-commune',
    seedPrice: 90,
    growthCost: 35,
    unlockHours: 3,
    stages: ['Bulbe planté', 'Feuilles', 'Bouton', 'Ouverte'],
  },
  tournesol: {
    id: 'tournesol',
    name: 'Tournesol',
    rarity: 'peu-commune',
    seedPrice: 130,
    growthCost: 50,
    unlockHours: 3,
    stages: ['Graine semée', 'Tige', 'Capitule', 'Face au soleil'],
  },
  lavande: {
    id: 'lavande',
    name: 'Lavande',
    rarity: 'rare',
    seedPrice: 220,
    growthCost: 90,
    unlockHours: 12,
    stages: ['Graine semée', 'Touffe', 'Épis verts', 'En fleur'],
  },
  cerisier: {
    id: 'cerisier',
    name: 'Cerisier',
    rarity: 'legendaire',
    seedPrice: 400,
    growthCost: 160,
    unlockHours: 35,
    stages: ['Noyau planté', 'Jeune pousse', 'Arbrisseau', 'En fleurs'],
  },
};

export const SPECIES_LIST: readonly Species[] = Object.values(SPECIES);

export const RARITY_LABEL: Record<Rarity, string> = {
  commune: 'Commune',
  'peu-commune': 'Peu commune',
  rare: 'Rare',
  legendaire: 'Légendaire',
};

/** Coût total pour mener une graine de l'achat à la maturité. */
export function totalCost(species: Species): number {
  return species.seedPrice + species.growthCost * FINAL_STAGE;
}
