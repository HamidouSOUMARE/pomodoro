/**
 * Décor de l'enclos, construit par le code plutôt qu'écrit à la main :
 * une grille de 80×68 en dur ferait 68 lignes de 80 caractères, illisible
 * et impossible à retoucher. Le rendu reste identique d'une fois sur
 * l'autre grâce à un générateur pseudo-aléatoire à graine fixe.
 */

export interface ScenePixel {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
}

export const SCENE = { width: 80, height: 68 } as const;

/** Bordure occupée par la clôture, de chaque côté. */
const FENCE = { top: 8, bottom: 8, side: 4 } as const;

export const FIELD = {
  x: FENCE.side,
  y: FENCE.top,
  width: SCENE.width - FENCE.side * 2,
  height: SCENE.height - FENCE.top - FENCE.bottom,
} as const;

const COLORS = {
  outline: '#0c110d',
  grass: '#4a7a3a',
  grassDark: '#3d6830',
  grassLight: '#5c8f45',
  soil: '#6b4b2a',
  soilDark: '#4a3220',
  wood: '#7a5230',
  woodLight: '#96683e',
  woodDark: '#563723',
  stone: '#7d7f74',
  stoneLight: '#9a9c8f',
  bush: '#2f5526',
  bushLight: '#41763a',
  petalWhite: '#f5f0e0',
  petalYellow: '#e8d44d',
  petalPink: '#f0708d',
} as const;

/** Emplacements des plantes : deux rangs de trois, en 16×16. */
export const SLOT_SIZE = 16;
export const SLOTS: readonly { x: number; y: number }[] = [
  { x: 6, y: 10 },
  { x: 32, y: 10 },
  { x: 58, y: 10 },
  { x: 6, y: 34 },
  { x: 32, y: 34 },
  { x: 58, y: 34 },
];

/** Générateur déterministe : même décor à chaque rendu. */
function makeRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** Une plante occupe-t-elle ce pixel ? Sert à ne pas semer d'herbe dessous. */
function insideSlot(x: number, y: number): boolean {
  return SLOTS.some(
    (slot) => x >= slot.x && x < slot.x + SLOT_SIZE && y >= slot.y && y < slot.y + SLOT_SIZE,
  );
}

function px(x: number, y: number, fill: string, w = 1, h = 1): ScenePixel {
  return { x, y, w, h, fill };
}

/** Reporte une petite grille de caractères à la position voulue. */
function blit(
  grid: readonly string[],
  originX: number,
  originY: number,
  palette: Record<string, string>,
): ScenePixel[] {
  const pixels: ScenePixel[] = [];
  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      const fill = palette[grid[y][x]];
      if (fill) pixels.push(px(originX + x, originY + y, fill));
    }
  }
  return pixels;
}

const BUSH = [
  '...kkkk...',
  '..kLLLLk..',
  '.kLLBLLLk.',
  'kLLLLLBLLk',
  'kLBLLLLLLk',
  '.kLLLLLLk.',
  '..kkkkkk..',
] as const;

const BARREL = [
  '.kkkkk.',
  'kWWWWWk',
  'kLLLLLk',
  'kWWWWWk',
  'kWWWWWk',
  'kLLLLLk',
  'kWWWWWk',
  '.kkkkk.',
] as const;

const DECOR_PALETTE: Record<string, string> = {
  k: COLORS.outline,
  B: COLORS.bush,
  L: COLORS.bushLight,
  W: COLORS.wood,
};

/** Fleurs sauvages : un point de couleur sur une tige, semées dans les allées. */
const WILDFLOWERS: readonly [number, number, keyof typeof COLORS][] = [
  [25, 12, 'petalWhite'],
  [28, 16, 'petalYellow'],
  [24, 20, 'petalPink'],
  [52, 22, 'petalWhite'],
  [55, 19, 'petalYellow'],
  [26, 38, 'petalYellow'],
  [29, 42, 'petalWhite'],
  [52, 40, 'petalPink'],
  [55, 44, 'petalWhite'],
  [12, 30, 'petalWhite'],
  [44, 30, 'petalYellow'],
  [70, 30, 'petalPink'],
  [8, 51, 'petalYellow'],
  [40, 51, 'petalWhite'],
  [66, 51, 'petalPink'],
];

/**
 * Buissons et fleurs sauvages : le jardin doit avoir l'air habité même quand
 * rien n'y pousse encore. Tout tient dans les allées entre les parcelles, ce
 * qu'un test vérifie.
 */
export function buildDecor(): ScenePixel[] {
  const pixels = [
    ...blit(BUSH, 22, 43, DECOR_PALETTE),
    ...blit(BUSH, 48, 10, DECOR_PALETTE),
    ...blit(BARREL, 23, 26, DECOR_PALETTE),
  ];

  for (const [x, y, tone] of WILDFLOWERS) {
    pixels.push(px(x, y + 1, COLORS.grassDark), px(x, y, COLORS[tone]));
  }

  return pixels;
}

/** Herbe, touffes et cailloux : tout ce qui est derrière les plantes. */
export function buildGround(): ScenePixel[] {
  const pixels: ScenePixel[] = [px(0, 0, COLORS.grass, SCENE.width, SCENE.height)];
  const random = makeRandom(20260910);

  // moucheture discrete : trop dense, elle vire au bruit de television
  for (let y = 1; y < SCENE.height - 1; y += 1) {
    for (let x = 1; x < SCENE.width - 1; x += 1) {
      if (insideSlot(x, y)) continue;
      if (random() > 0.965) pixels.push(px(x, y, COLORS.grassDark));
    }
  }

  // touffes d'herbe : trois brins, bien plus lisibles que des pixels isoles
  let placed = 0;
  for (let attempt = 0; attempt < 400 && placed < 18; attempt += 1) {
    const x = FIELD.x + 1 + Math.floor(random() * (FIELD.width - 4));
    const y = FIELD.y + 1 + Math.floor(random() * (FIELD.height - 3));
    if (insideSlot(x, y) || insideSlot(x + 2, y + 1)) continue;

    const tone = random() > 0.5 ? COLORS.grassLight : COLORS.grassDark;
    pixels.push(px(x, y, tone), px(x + 2, y, tone), px(x + 1, y + 1, tone));
    placed += 1;
  }

  // quelques cailloux pour casser l'uniformite
  const stones = [
    [10, 30],
    [66, 26],
    [40, 52],
  ] as const;
  for (const [x, y] of stones) {
    if (insideSlot(x, y)) continue;
    pixels.push(px(x, y, COLORS.stoneLight, 2, 1), px(x, y + 1, COLORS.stone, 3, 1));
  }

  return pixels;
}

/** Un poteau de clôture, dessiné depuis son sommet. */
function post(x: number, y: number, height: number): ScenePixel[] {
  return [
    px(x, y, COLORS.outline, 4, 1),
    px(x, y + 1, COLORS.woodLight, 1, height - 2),
    px(x + 1, y + 1, COLORS.wood, 2, height - 2),
    px(x + 3, y + 1, COLORS.woodDark, 1, height - 2),
    px(x, y + height - 1, COLORS.outline, 4, 1),
  ];
}

/** Deux lisses horizontales entre deux poteaux. */
function rails(x: number, width: number, y: number): ScenePixel[] {
  return [
    px(x, y, COLORS.outline, width, 1),
    px(x, y + 1, COLORS.woodLight, width, 1),
    px(x, y + 2, COLORS.wood, width, 1),
    px(x, y + 3, COLORS.outline, width, 1),
  ];
}

/** Clôture du fond et des côtés : dessinée derrière les plantes. */
export function buildBackFence(): ScenePixel[] {
  const pixels: ScenePixel[] = [];

  pixels.push(...rails(0, SCENE.width, 1));
  for (let x = 0; x < SCENE.width; x += 19) {
    pixels.push(...post(x, 0, FENCE.top));
  }

  // montants lateraux, plus discrets
  for (let y = FENCE.top; y < SCENE.height - FENCE.bottom; y += 18) {
    pixels.push(...post(0, y, 10));
    pixels.push(...post(SCENE.width - 4, y, 10));
  }

  return pixels;
}

/** Clôture de devant : passe par-dessus les plantes, ce qui donne la profondeur. */
export function buildFrontFence(): ScenePixel[] {
  const pixels: ScenePixel[] = [];
  const y = SCENE.height - FENCE.bottom;

  pixels.push(...rails(0, SCENE.width, y + 1));
  for (let x = 0; x < SCENE.width; x += 19) {
    pixels.push(...post(x, y - 1, FENCE.bottom + 1));
  }

  return pixels;
}
