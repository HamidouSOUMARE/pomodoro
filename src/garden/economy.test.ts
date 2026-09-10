import { describe, expect, it } from 'vitest';
import {
  EMPTY_GARDEN,
  MAX_PLOTS,
  SESSION_BONUS,
  isSpeciesUnlocked,
  milestones,
  nextMilestone,
  plotsUnlocked,
  rewardForFocus,
} from './economy';
import { SPECIES, SPECIES_LIST, totalCost } from './species';
import type { GardenState } from './types';

const hours = (h: number) => h * 3600;
const garden = (patch: Partial<GardenState> = {}): GardenState => ({ ...EMPTY_GARDEN, ...patch });

describe('rewardForFocus', () => {
  it('donne 1 rayon par minute de focus', () => {
    expect(rewardForFocus(25, 0).base).toBe(25);
    expect(rewardForFocus(50, 0).base).toBe(50);
  });

  it('prime un focus sur trois', () => {
    expect(rewardForFocus(25, 0)).toMatchObject({ streak: 1, streakBonus: 0, total: 25 });
    expect(rewardForFocus(25, 1)).toMatchObject({ streak: 2, streakBonus: 0 });
    expect(rewardForFocus(25, 2)).toMatchObject({ streak: 3, streakBonus: 15, total: 40 });
    expect(rewardForFocus(25, 5)).toMatchObject({ streak: 6, streakBonus: 15 });
  });

  it('ne renvoie jamais de gain negatif', () => {
    expect(rewardForFocus(-10, 0).base).toBe(0);
  });
});

describe('une session type de 3 h', () => {
  it('rapporte environ 180 rayons', () => {
    // 5 focus de 25 min, une serie de 3 atteinte, puis le bonus de session
    let streak = 0;
    let total = 0;
    for (let i = 0; i < 5; i += 1) {
      const reward = rewardForFocus(25, streak);
      streak = reward.streak;
      total += reward.total;
    }
    total += SESSION_BONUS;

    expect(total).toBe(180);
  });
});

describe('paliers', () => {
  it('ouvre deux parcelles au depart et six au bout de 50 h', () => {
    expect(plotsUnlocked(0)).toBe(2);
    expect(plotsUnlocked(hours(1))).toBe(3);
    expect(plotsUnlocked(hours(5.9))).toBe(3);
    expect(plotsUnlocked(hours(6))).toBe(4);
    expect(plotsUnlocked(hours(20))).toBe(5);
    expect(plotsUnlocked(hours(50))).toBe(MAX_PLOTS);
    expect(plotsUnlocked(hours(500))).toBe(MAX_PLOTS);
  });

  it('debloque les especes selon les heures de focus', () => {
    expect(isSpeciesUnlocked(SPECIES.paquerette, 0)).toBe(true);
    expect(isSpeciesUnlocked(SPECIES.tulipe, 0)).toBe(false);
    expect(isSpeciesUnlocked(SPECIES.tulipe, hours(3))).toBe(true);
    expect(isSpeciesUnlocked(SPECIES.cerisier, hours(34))).toBe(false);
    expect(isSpeciesUnlocked(SPECIES.cerisier, hours(35))).toBe(true);
  });

  it('liste les paliers dans l ordre, sans doublon d heure', () => {
    const list = milestones();
    const heures = list.map((m) => m.hours);
    expect(heures).toEqual([...heures].sort((a, b) => a - b));
    expect(new Set(heures).size).toBe(heures.length);
    // tulipe et tournesol tombent tous deux a 3 h : une seule ligne
    expect(list.find((m) => m.hours === 3)?.label).toBe('Tulipe · Tournesol');
  });

  it('annonce le prochain palier, puis plus rien a la fin', () => {
    expect(nextMilestone(0)?.hours).toBe(1);
    expect(nextMilestone(hours(1))?.hours).toBe(3);
    expect(nextMilestone(hours(49))?.hours).toBe(50);
    expect(nextMilestone(hours(50))).toBeNull();
  });
});

describe('echelle des prix', () => {
  it('classe les graines par cout croissant selon la rarete', () => {
    const order = SPECIES_LIST.map((s) => s.id);
    const costs = order.map((id) => totalCost(SPECIES[id]));
    expect(costs).toEqual([...costs].sort((a, b) => a - b));
  });

  it('reste atteignable : la premiere fleur coute moins d une session', () => {
    expect(totalCost(SPECIES.paquerette)).toBeLessThan(180);
  });

  it('garde le legendaire ambitieux mais fini', () => {
    const cerisier = totalCost(SPECIES.cerisier);
    expect(cerisier).toBe(880);
    // environ cinq sessions de 3 h
    expect(Math.round(cerisier / 180)).toBe(5);
  });

  it('fait croitre le cout de croissance avec le prix de la graine', () => {
    for (const species of SPECIES_LIST) {
      expect(species.growthCost).toBeLessThan(species.seedPrice);
      expect(species.growthCost).toBeGreaterThan(species.seedPrice * 0.3);
    }
  });
});

describe('etat vide', () => {
  it('demarre sans rayons et sans plante', () => {
    const state = garden();
    expect(state.rayons).toBe(0);
    expect(state.plots).toHaveLength(MAX_PLOTS);
    expect(state.plots.every((p) => p === null)).toBe(true);
  });
});

describe('plotUnlockHours', () => {
  it('donne l heure d ouverture de chaque parcelle', async () => {
    const { plotUnlockHours } = await import('./economy');
    expect(plotUnlockHours(0)).toBe(0);
    expect(plotUnlockHours(1)).toBe(0);
    expect(plotUnlockHours(2)).toBe(1);
    expect(plotUnlockHours(3)).toBe(6);
    expect(plotUnlockHours(4)).toBe(20);
    expect(plotUnlockHours(5)).toBe(50);
  });

  it('reste coherent avec plotsUnlocked', async () => {
    const { plotUnlockHours, plotsUnlocked } = await import('./economy');
    for (let index = 0; index < MAX_PLOTS; index += 1) {
      const hours = plotUnlockHours(index);
      expect(plotsUnlocked(hours * 3600)).toBeGreaterThanOrEqual(index + 1);
    }
  });
});
