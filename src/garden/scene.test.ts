import { describe, expect, it } from 'vitest';
import {
  FIELD,
  SCENE,
  SLOTS,
  SLOT_SIZE,
  buildBackFence,
  buildDecor,
  buildFrontFence,
  buildGround,
  type ScenePixel,
} from './scene';

const covers = (pixel: ScenePixel, x: number, y: number) =>
  x >= pixel.x && x < pixel.x + pixel.w && y >= pixel.y && y < pixel.y + pixel.h;

const overlapsSlot = (pixel: ScenePixel) =>
  SLOTS.some(
    (slot) =>
      pixel.x < slot.x + SLOT_SIZE &&
      pixel.x + pixel.w > slot.x &&
      pixel.y < slot.y + SLOT_SIZE &&
      pixel.y + pixel.h > slot.y,
  );

describe('decor de l enclos', () => {
  it('ne deborde jamais sur une parcelle', () => {
    for (const pixel of buildDecor()) {
      expect(overlapsSlot(pixel), `pixel en ${pixel.x},${pixel.y}`).toBe(false);
    }
  });

  it('reste a l interieur du champ', () => {
    for (const pixel of buildDecor()) {
      expect(pixel.x).toBeGreaterThanOrEqual(FIELD.x);
      expect(pixel.y).toBeGreaterThanOrEqual(FIELD.y);
      expect(pixel.x + pixel.w).toBeLessThanOrEqual(FIELD.x + FIELD.width);
      expect(pixel.y + pixel.h).toBeLessThanOrEqual(FIELD.y + FIELD.height);
    }
  });
});

describe('parcelles', () => {
  it('tiennent toutes dans le champ, cloture comprise', () => {
    for (const slot of SLOTS) {
      expect(slot.x).toBeGreaterThanOrEqual(FIELD.x);
      expect(slot.y).toBeGreaterThanOrEqual(FIELD.y);
      expect(slot.x + SLOT_SIZE).toBeLessThanOrEqual(FIELD.x + FIELD.width);
      expect(slot.y + SLOT_SIZE).toBeLessThanOrEqual(FIELD.y + FIELD.height);
    }
  });

  it('ne se chevauchent pas entre elles', () => {
    for (let a = 0; a < SLOTS.length; a += 1) {
      for (let b = a + 1; b < SLOTS.length; b += 1) {
        const far =
          Math.abs(SLOTS[a].x - SLOTS[b].x) >= SLOT_SIZE ||
          Math.abs(SLOTS[a].y - SLOTS[b].y) >= SLOT_SIZE;
        expect(far, `parcelles ${a} et ${b}`).toBe(true);
      }
    }
  });
});

describe('sol et cloture', () => {
  it('couvrent toute la scene sans deborder', () => {
    for (const pixel of [...buildGround(), ...buildBackFence(), ...buildFrontFence()]) {
      expect(pixel.x).toBeGreaterThanOrEqual(0);
      expect(pixel.y).toBeGreaterThanOrEqual(0);
      expect(pixel.x + pixel.w).toBeLessThanOrEqual(SCENE.width);
      expect(pixel.y + pixel.h).toBeLessThanOrEqual(SCENE.height);
    }
  });

  it('donnent le meme decor a chaque appel', () => {
    expect(buildGround()).toEqual(buildGround());
  });

  it('laissent les parcelles libres de touffes d herbe', () => {
    const tufts = buildGround().slice(1); // la premiere entree est le fond
    for (const slot of SLOTS) {
      const centre = tufts.filter((pixel) => covers(pixel, slot.x + 8, slot.y + 8));
      expect(centre, `parcelle ${slot.x},${slot.y}`).toHaveLength(0);
    }
  });
});
