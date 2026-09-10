import { describe, expect, it } from 'vitest';
import { PLANT_PALETTE, getPlantSprite, getSoilSprite, plantGrid } from './plants';
import { SPECIES_LIST } from './species';
import { FINAL_STAGE, STAGE_COUNT } from './types';

const GRIDS = SPECIES_LIST.flatMap((species) =>
  Array.from({ length: STAGE_COUNT }, (_, stage) => ({
    label: `${species.id} stade ${stage}`,
    grid: plantGrid(species.id, stage),
  })),
);

describe('grilles des plantes', () => {
  it('sont toutes carrees en 16x16', () => {
    for (const { label, grid } of GRIDS) {
      expect(grid, label).toHaveLength(16);
      for (const row of grid) expect(row, `${label} : "${row}"`).toHaveLength(16);
    }
  });

  it('n utilisent que des couleurs connues', () => {
    const known = new Set([...Object.keys(PLANT_PALETTE), '.']);
    for (const { label, grid } of GRIDS) {
      for (const row of grid) {
        for (const char of row) {
          expect(known.has(char), `${label} : caractere inconnu "${char}"`).toBe(true);
        }
      }
    }
  });

  it('posent toutes la plante sur la meme motte de terre', () => {
    const ground = (grid: string[]) => grid.slice(12).join('|');
    const reference = ground(GRIDS[0].grid);
    for (const { label, grid } of GRIDS) {
      expect(ground(grid), label).toBe(reference);
    }
    expect(ground(getSoilSprite() && plantGrid('paquerette', 0))).toBe(reference);
  });

  it('partagent la graine et la pousse entre especes', () => {
    for (const species of SPECIES_LIST) {
      expect(plantGrid(species.id, 0)).toEqual(plantGrid('paquerette', 0));
      expect(plantGrid(species.id, 1)).toEqual(plantGrid('paquerette', 1));
    }
  });

  it('donnent une silhouette differente a chaque espece une fois epanouie', () => {
    const blooms = SPECIES_LIST.map((s) => plantGrid(s.id, FINAL_STAGE).join('|'));
    expect(new Set(blooms).size).toBe(SPECIES_LIST.length);
  });

  it('gagnent en matiere en grandissant', () => {
    for (const species of SPECIES_LIST) {
      const painted = (stage: number) => getPlantSprite(species.id, stage).pixels.length;
      expect(painted(1), species.id).toBeGreaterThan(painted(0));
      expect(painted(2), species.id).toBeGreaterThan(painted(1));
      expect(painted(FINAL_STAGE), species.id).toBeGreaterThan(painted(2));
    }
  });

  it('bornent les stades hors limites', () => {
    expect(plantGrid('tulipe', -3)).toEqual(plantGrid('tulipe', 0));
    expect(plantGrid('tulipe', 99)).toEqual(plantGrid('tulipe', FINAL_STAGE));
  });
});
