import type { Mode } from '../types';

/** Chaque lettre = une couleur, "." = transparent. */
const PALETTE: Record<string, string> = {
  k: '#0c110d', // contour
  G: '#6abf4b',
  H: '#3d7a2e', // verts
  R: '#e8493c',
  D: '#b53228',
  P: '#f59a90', // tomate
  Y: '#e8d44d',
  L: '#f5ea9a',
  d: '#b8a52f', // citron
  M: '#f0708d',
  W: '#efe6c8',
  s: '#0c110d', // pastèque
};

const SPRITES: Record<Mode, readonly string[]> = {
  focus: [
    '......GG........',
    '......GG........',
    '..HH..GG..HH....',
    '...HHHGGHHH.....',
    '....HHGGHH......',
    '...kkkkkkkkkk...',
    '..kRRRRRRRRRRk..',
    '.kRPPRRRRRRRRRk.',
    '.kRPPkkRRRkkRRk.',
    'kRRRRkkRRRkkRRRk',
    'kRRRRRRRRRRRRRRk',
    'kRRRRRkRRRkRRRRk',
    '.kRRRRRkkkRRRRk.',
    '.kDDRRRRRRRRDDk.',
    '..kkkkkkkkkkkk..',
  ],
  short: [
    '..........HH....',
    '.........HH.....',
    '...kkkkkHH......',
    '..kYYYYYYYkk....',
    '.kYLLYYYYYYYk...',
    'kYLLYkkYYkkYYk..',
    'kYYYYkkYYkkYYYk.',
    'kYYYYYYYYYYYYYk.',
    'kYYYYYkYYYkYYYk.',
    '.kdYYYYkkkYYYdk.',
    '..kkkkkkkkkkkk..',
  ],
  long: [
    '....kkkkkkkk....',
    '..kkMMMMMMMMkk..',
    '.kMMsMMMMMMsMMk.',
    '.kMMMMkkMkkMMMk.',
    'kMMMMMkkMkkMMMMk',
    'kMMsMMMMMMMMsMMk',
    'kMMMMMkMMMkMMMMk',
    '.kMMMMMkkkMMMMk.',
    '.kWWWWWWWWWWWWk.',
    'kGGGGGGGGGGGGGGk',
    '.kGGGGGGGGGGGGk.',
    '..kkkkkkkkkkkk..',
  ],
};

export interface SpritePixel {
  x: number;
  y: number;
  fill: string;
}

export interface SpriteData {
  width: number;
  height: number;
  pixels: SpritePixel[];
}

/** Convertit la grille de caractères en liste de pixels prêts à dessiner. */
export function getSprite(mode: Mode): SpriteData {
  const grid = SPRITES[mode];
  const height = grid.length;
  const width = grid[0].length;
  const pixels: SpritePixel[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const fill = PALETTE[grid[y][x]];
      if (fill) pixels.push({ x, y, fill });
    }
  }

  return { width, height, pixels };
}
