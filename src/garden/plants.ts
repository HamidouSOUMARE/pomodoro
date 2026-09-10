import { gridToSprite, type SpriteData } from '../lib/sprites';
import { FINAL_STAGE, STAGE_COUNT, type SpeciesId } from './types';

/** Palette du jardin. "." = transparent. */
const PALETTE: Record<string, string> = {
  k: '#0c110d', // contour
  b: '#6b4b2a', // terre
  B: '#4a3220', // terre sombre
  s: '#8a6a3a', // graine / coeur de tournesol
  G: '#6abf4b', // feuille
  H: '#3d7a2e', // tige
  T: '#7a5230', // tronc
  W: '#f5f0e0', // pétale blanc
  Y: '#e8d44d', // jaune
  R: '#e8493c', // rouge
  D: '#8c1f18', // coeur de coquelicot
  M: '#f0708d', // rose
  m: '#f7b3c4', // rose clair
  P: '#8b6fc4', // violet
  p: '#b39ae0', // violet clair
};

/** Motte de terre, commune à tous les stades. */
const GROUND = [
  '...kkkkkkkkkk...',
  '..kbbbbbbbbbbk..',
  '.kbBbbbbbbBbbbk.',
  '..kkkkkkkkkkkk..',
] as const;

/** Tige et feuilles, communes à toutes les fleurs. */
const STEM = [
  '......kHHk......',
  '...kkkkHHkkkk...',
  '..kGGGGHHGGGGk..',
  '...kkkkHHkkkk...',
] as const;

/** Variante à tronc, pour le cerisier. */
const TRUNK = [
  '......kTTk......',
  '...kkkkTTkkkk...',
  '..kGGGGTTGGGGk..',
  '...kkkkTTkkkk...',
] as const;

const EMPTY = '................';
const BLANK_HEAD = Array.from({ length: 8 }, () => EMPTY);

/** Stade 0 : la graine repose sur la motte, sans tige. */
const SEED_STAGE = [
  ...Array.from({ length: 10 }, () => EMPTY),
  '......kkkk......',
  '......kssk......',
  ...GROUND,
];

/** Stade 1 : une pousse identique pour toutes les espèces. */
const SPROUT_STAGE = [...BLANK_HEAD, ...STEM, ...GROUND];

/** Assemble une tête de 8 lignes avec la base choisie. */
function plant(head: readonly string[], base: readonly string[] = STEM): string[] {
  return [...head, ...base, ...GROUND];
}

const HEADS: Record<SpeciesId, { bud: readonly string[]; bloom: readonly string[] }> = {
  paquerette: {
    bud: [
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      '......kkkk......',
      '.....kGHHGk.....',
      '.....kGHHGk.....',
      '......kkkk......',
    ],
    bloom: [
      '......kkkk......',
      '....kkWWWWkk....',
      '...kWWWWWWWWk...',
      '..kWWWkYYkWWWk..',
      '..kWWWkYYkWWWk..',
      '...kWWWWWWWWk...',
      '....kkWWWWkk....',
      '......kkkk......',
    ],
  },
  coquelicot: {
    bud: [
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      '......kkkk......',
      '.....kGRRGk.....',
      '.....kGRRGk.....',
      '......kkkk......',
    ],
    bloom: [
      '......kkkk......',
      '....kkRRRRkk....',
      '...kRRRRRRRRk...',
      '..kRRRkDDkRRRk..',
      '..kRRRkDDkRRRk..',
      '...kRRRRRRRRk...',
      '....kkRRRRkk....',
      '......kkkk......',
    ],
  },
  tulipe: {
    bud: [
      EMPTY,
      EMPTY,
      '......kkkk......',
      '.....kHGGHk.....',
      '.....kHGGHk.....',
      '.....kHGGHk.....',
      '......kGGk......',
      '......kkkk......',
    ],
    bloom: [
      EMPTY,
      '....kk.kk.kk....',
      '...kMMkMMkMMk...',
      '...kMMMMMMMMk...',
      '...kMMMMMMMMk...',
      '....kMmMMMMk....',
      '.....kMMMMk.....',
      '......kkkk......',
    ],
  },
  tournesol: {
    bud: [
      EMPTY,
      EMPTY,
      EMPTY,
      '......kkkk......',
      '....kkGGGGkk....',
      '....kGGGGGGk....',
      '....kkGGGGkk....',
      '......kkkk......',
    ],
    bloom: [
      '.....kkkkkk.....',
      '...kkYYYYYYkk...',
      '..kYYYYYYYYYYk..',
      '..kYYksssskYYk..',
      '..kYYksssskYYk..',
      '..kYYYYYYYYYYk..',
      '...kkYYYYYYkk...',
      '.....kkkkkk.....',
    ],
  },
  lavande: {
    bud: [
      EMPTY,
      EMPTY,
      '....kk..kk..kk..',
      '...kGGkkGGkkGGk.',
      '...kGGkkGGkkGGk.',
      '...kGGkkGGkkGGk.',
      '...kHHHHHHHHHHk.',
      '....kHHHHHHHHk..',
    ],
    bloom: [
      '....kk..kk..kk..',
      '...kPPkkPPkkPPk.',
      '...kppkkppkkppk.',
      '...kPPkkPPkkPPk.',
      '...kppkkppkkppk.',
      '...kPPkkPPkkPPk.',
      '...kHHHHHHHHHHk.',
      '....kHHHHHHHHk..',
    ],
  },
  cerisier: {
    bud: [
      EMPTY,
      '.....kkkkkk.....',
      '...kkGGGGGGkk...',
      '..kGGGGGGGGGGk..',
      '..kGGGGGGGGGGk..',
      '...kkGGGGGGkk...',
      '.....kkkkkk.....',
      '......kTTk......',
    ],
    bloom: [
      '.....kkkkkk.....',
      '...kkMMMMMMkk...',
      '..kMMmMMMMmMMk..',
      '.kMMMMMMMMMMMMk.',
      '.kMMmMMMMMMmMMk.',
      '..kMMMMMMMMMMk..',
      '...kkMMMMMMkk...',
      '.....kkTTkk.....',
    ],
  },
};

function baseFor(id: SpeciesId): readonly string[] {
  return id === 'cerisier' ? TRUNK : STEM;
}

/** Grille d'une espèce à un stade donné. */
export function plantGrid(id: SpeciesId, stage: number): string[] {
  if (stage <= 0) return SEED_STAGE;
  if (stage === 1) return SPROUT_STAGE;
  const head = stage >= FINAL_STAGE ? HEADS[id].bloom : HEADS[id].bud;
  return plant(head, baseFor(id));
}

export function getPlantSprite(id: SpeciesId, stage: number): SpriteData {
  return gridToSprite(plantGrid(id, stage), PALETTE);
}

/** Motte nue, pour une parcelle libre. */
export function getSoilSprite(): SpriteData {
  return gridToSprite([...Array.from({ length: 12 }, () => EMPTY), ...GROUND], PALETTE);
}

export const PLANT_PALETTE = PALETTE;
export const PLANT_STAGES = STAGE_COUNT;
