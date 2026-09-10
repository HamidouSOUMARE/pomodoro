import { describe, expect, it } from 'vitest';
import { EMPTY_GARDEN, SESSION_BONUS } from './economy';
import {
  breakStreak,
  collectionSize,
  grantFocus,
  grantSessionBonus,
  growPlant,
  harvestPlant,
  plantSeed,
} from './reducer';
import { SPECIES } from './species';
import { FINAL_STAGE, type GardenState } from './types';

const hours = (h: number) => h * 3600;
const garden = (patch: Partial<GardenState> = {}): GardenState => ({ ...EMPTY_GARDEN, ...patch });

describe('grantFocus', () => {
  it('credite les rayons et cumule le temps de focus', () => {
    const { state, reward } = grantFocus(garden(), 25);
    expect(reward.total).toBe(25);
    expect(state.rayons).toBe(25);
    expect(state.lifetimeRayons).toBe(25);
    expect(state.focusSeconds).toBe(1500);
    expect(state.streak).toBe(1);
  });

  it('ajoute la prime au troisieme focus d affilee', () => {
    let state = garden();
    for (let i = 0; i < 3; i += 1) state = grantFocus(state, 25).state;
    expect(state.rayons).toBe(25 * 3 + 15);
    expect(state.streak).toBe(3);
  });
});

describe('grantSessionBonus', () => {
  it('ajoute la prime de session sans toucher au temps de focus', () => {
    const state = grantSessionBonus(garden({ rayons: 10, focusSeconds: 600 }));
    expect(state.rayons).toBe(10 + SESSION_BONUS);
    expect(state.focusSeconds).toBe(600);
  });
});

describe('breakStreak', () => {
  it('remet la serie a zero', () => {
    expect(breakStreak(garden({ streak: 2 })).streak).toBe(0);
  });

  it('renvoie le meme objet quand il n y a rien a casser', () => {
    const state = garden();
    expect(breakStreak(state)).toBe(state);
  });
});

describe('plantSeed', () => {
  it('seme dans la premiere parcelle libre et debite la graine', () => {
    const state = plantSeed(garden({ rayons: 100 }), 'paquerette');
    expect(state.rayons).toBe(100 - SPECIES.paquerette.seedPrice);
    expect(state.plots[0]).toEqual({ species: 'paquerette', stage: 0 });
    expect(state.plots[1]).toBeNull();
  });

  it('refuse sans assez de rayons', () => {
    const before = garden({ rayons: 10 });
    expect(plantSeed(before, 'paquerette')).toBe(before);
  });

  it('refuse une espece non debloquee, meme avec les rayons', () => {
    const before = garden({ rayons: 10_000 });
    expect(plantSeed(before, 'cerisier')).toBe(before);
    expect(plantSeed(garden({ rayons: 10_000, focusSeconds: hours(35) }), 'cerisier').plots[0])
      .toEqual({ species: 'cerisier', stage: 0 });
  });

  it('refuse quand les parcelles ouvertes sont toutes prises', () => {
    // deux parcelles ouvertes au depart, on les remplit
    let state = garden({ rayons: 200 });
    state = plantSeed(state, 'paquerette');
    state = plantSeed(state, 'paquerette');
    const full = state;
    expect(plantSeed(full, 'paquerette')).toBe(full);

    // la troisieme parcelle s ouvre a 1 h de focus
    const wider = plantSeed({ ...full, focusSeconds: hours(1) }, 'paquerette');
    expect(wider.plots[2]).toEqual({ species: 'paquerette', stage: 0 });
  });
});

describe('growPlant', () => {
  it('fait monter d un stade contre des rayons', () => {
    let state = plantSeed(garden({ rayons: 100 }), 'paquerette');
    const before = state.rayons;
    state = growPlant(state, 0);
    expect(state.plots[0]?.stage).toBe(1);
    expect(state.rayons).toBe(before - SPECIES.paquerette.growthCost);
  });

  it('s arrete a maturite', () => {
    let state = plantSeed(garden({ rayons: 1000 }), 'paquerette');
    for (let i = 0; i < FINAL_STAGE; i += 1) state = growPlant(state, 0);
    expect(state.plots[0]?.stage).toBe(FINAL_STAGE);

    const mature = state;
    expect(growPlant(mature, 0)).toBe(mature);
  });

  it('refuse sans assez de rayons et sur une parcelle vide', () => {
    const poor = plantSeed(garden({ rayons: SPECIES.paquerette.seedPrice }), 'paquerette');
    expect(growPlant(poor, 0)).toBe(poor);

    const empty = garden({ rayons: 500 });
    expect(growPlant(empty, 1)).toBe(empty);
  });
});

describe('harvestPlant', () => {
  const grown = () => {
    let state = plantSeed(garden({ rayons: 1000 }), 'paquerette');
    for (let i = 0; i < FINAL_STAGE; i += 1) state = growPlant(state, 0);
    return state;
  };

  it('refuse de cueillir une plante encore en croissance', () => {
    const young = plantSeed(garden({ rayons: 100 }), 'paquerette');
    expect(harvestPlant(young, 0)).toBe(young);
  });

  it('libere la parcelle et range la plante dans la collection', () => {
    const state = harvestPlant(grown(), 0);
    expect(state.plots[0]).toBeNull();
    expect(state.collection.paquerette).toBe(1);
    expect(collectionSize(state)).toBe(1);
  });

  it('cumule les cueillettes d une meme espece', () => {
    let state = harvestPlant(grown(), 0);
    state = { ...state, rayons: 1000 };
    state = plantSeed(state, 'paquerette');
    for (let i = 0; i < FINAL_STAGE; i += 1) state = growPlant(state, 0);
    state = harvestPlant(state, 0);

    expect(state.collection.paquerette).toBe(2);
    expect(collectionSize(state)).toBe(2);
  });

  it('ne touche a rien sur une parcelle vide', () => {
    const empty = garden();
    expect(harvestPlant(empty, 3)).toBe(empty);
  });
});

describe('parcours complet d une paquerette', () => {
  it('coute exactement le total annonce', () => {
    const cost = SPECIES.paquerette.seedPrice + SPECIES.paquerette.growthCost * FINAL_STAGE;
    let state = garden({ rayons: cost });
    state = plantSeed(state, 'paquerette');
    for (let i = 0; i < FINAL_STAGE; i += 1) state = growPlant(state, 0);

    expect(state.rayons).toBe(0);
    expect(state.plots[0]).toEqual({ species: 'paquerette', stage: FINAL_STAGE });
  });
});

describe('banc d essai', () => {
  it('credite des rayons et alimente le cumul', async () => {
    const { grantRayons } = await import('./reducer');
    const state = grantRayons(garden({ rayons: 10, lifetimeRayons: 10 }), 500);
    expect(state.rayons).toBe(510);
    expect(state.lifetimeRayons).toBe(510);
  });

  it('ignore un montant nul ou negatif', async () => {
    const { grantRayons } = await import('./reducer');
    const before = garden({ rayons: 10 });
    expect(grantRayons(before, 0)).toBe(before);
    expect(grantRayons(before, -100)).toBe(before);
  });

  it('avance le compteur de focus pour franchir un palier', async () => {
    const { addFocusTime } = await import('./reducer');
    const { plotsUnlocked } = await import('./economy');
    const state = addFocusTime(garden(), 6 * 3600);
    expect(state.focusSeconds).toBe(6 * 3600);
    expect(plotsUnlocked(state.focusSeconds)).toBe(4);
  });

  it('vide entierement le jardin', async () => {
    const { resetGarden } = await import('./reducer');
    const cleared = resetGarden();
    expect(cleared.rayons).toBe(0);
    expect(cleared.focusSeconds).toBe(0);
    expect(cleared.collection).toEqual({});
    expect(cleared.plots.every((p) => p === null)).toBe(true);
  });
});
