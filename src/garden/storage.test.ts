import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadGarden, saveGarden } from './storage';
import { EMPTY_GARDEN, MAX_PLOTS } from './economy';

const store = new Map<string, string>();

vi.stubGlobal('window', {
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  },
});

const write = (value: unknown) => store.set('pomodoro-jardin', JSON.stringify(value));

describe('loadGarden', () => {
  beforeEach(() => store.clear());

  it('part d un jardin vide sans sauvegarde', () => {
    expect(loadGarden()).toEqual(EMPTY_GARDEN);
  });

  it('ignore un JSON corrompu', () => {
    store.set('pomodoro-jardin', '{oops');
    expect(loadGarden()).toEqual(EMPTY_GARDEN);
  });

  it('relit un jardin sauvegarde', () => {
    const state = { ...EMPTY_GARDEN, rayons: 120, focusSeconds: 7200, streak: 2 };
    state.plots[1] = { species: 'tulipe', stage: 2 };
    saveGarden(state);

    const loaded = loadGarden();
    expect(loaded.rayons).toBe(120);
    expect(loaded.focusSeconds).toBe(7200);
    expect(loaded.plots[1]).toEqual({ species: 'tulipe', stage: 2 });
  });

  it('refuse les valeurs negatives ou absurdes', () => {
    write({ rayons: -50, focusSeconds: 'beaucoup', streak: -3, plots: [] });
    const loaded = loadGarden();
    expect(loaded.rayons).toBe(0);
    expect(loaded.focusSeconds).toBe(0);
    expect(loaded.streak).toBe(0);
  });

  it('ecarte une espece inconnue et borne les stades', () => {
    write({
      ...EMPTY_GARDEN,
      plots: [{ species: 'orchidee', stage: 1 }, { species: 'tulipe', stage: 99 }],
    });
    const loaded = loadGarden();
    expect(loaded.plots[0]).toBeNull();
    expect(loaded.plots[1]).toEqual({ species: 'tulipe', stage: 3 });
  });

  it('ramene toujours le tableau a la taille maximale', () => {
    write({ ...EMPTY_GARDEN, plots: [{ species: 'paquerette', stage: 0 }] });
    expect(loadGarden().plots).toHaveLength(MAX_PLOTS);
  });

  it('ne laisse pas le cumul passer sous le solde courant', () => {
    write({ ...EMPTY_GARDEN, rayons: 500, lifetimeRayons: 10 });
    expect(loadGarden().lifetimeRayons).toBe(500);
  });
});
