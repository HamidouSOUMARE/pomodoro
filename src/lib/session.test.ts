import { describe, expect, it } from 'vitest';
import { breakAfterFocus, describePlan, formatClock, formatMinutes, planSession } from './session';
import { DEFAULT_SETTINGS, type Settings } from '../types';

const base = (overrides: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...overrides });

describe('planSession', () => {
  it('renvoie null quand la session est illimitée', () => {
    expect(planSession(base({ sessionLimit: 0 }))).toBeNull();
  });

  it('répartit 3 h en focus de 25 min, pauses comprises', () => {
    const plan = planSession(base({ sessionLimit: 180 }));

    // 25 + (5+25)*3 + (15+25) = 155 min ; un focus de plus dépasserait les 180 min
    expect(plan).toEqual({
      focusCount: 5,
      breakCount: 4,
      plannedSeconds: 155 * 60,
      budgetSeconds: 180 * 60,
    });
  });

  it('ne planifie jamais au-delà de l enveloppe demandée', () => {
    for (const sessionLimit of [15, 45, 90, 200, 480, 720]) {
      const plan = planSession(base({ sessionLimit }));
      expect(plan?.plannedSeconds).toBeLessThanOrEqual(sessionLimit * 60);
    }
  });

  it('ne compte aucun focus quand l enveloppe est plus courte qu un focus', () => {
    const plan = planSession(base({ sessionLimit: 15, focus: 25 }));
    expect(plan?.focusCount).toBe(0);
    expect(plan?.plannedSeconds).toBe(0);
  });

  it('intercale une pause de moins que le nombre de focus', () => {
    const plan = planSession(base({ sessionLimit: 240 }));
    expect(plan?.breakCount).toBe((plan?.focusCount ?? 0) - 1);
  });

  it('tient compte des durées personnalisées', () => {
    const plan = planSession(base({ sessionLimit: 60, focus: 50, short: 10, long: 20 }));
    expect(plan?.focusCount).toBe(1);
    expect(plan?.plannedSeconds).toBe(50 * 60);
  });
});

describe('breakAfterFocus', () => {
  it('donne une pause courte entre deux focus du cycle', () => {
    expect(breakAfterFocus(1, base())).toBe('short');
    expect(breakAfterFocus(3, base())).toBe('short');
  });

  it('donne une grande pause tous les `cycles` focus', () => {
    expect(breakAfterFocus(4, base())).toBe('long');
    expect(breakAfterFocus(8, base())).toBe('long');
    expect(breakAfterFocus(3, base({ cycles: 3 }))).toBe('long');
  });
});

describe('formatMinutes', () => {
  it('formate heures et minutes', () => {
    expect(formatMinutes(0)).toBe('illimité');
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(120)).toBe('2 h');
    expect(formatMinutes(155)).toBe('2 h 35');
  });
});

describe('formatClock', () => {
  it('passe en heures au-delà de 60 minutes', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(1500)).toBe('25:00');
    expect(formatClock(9300)).toBe('2:35:00');
    expect(formatClock(0, true)).toBe('0:00:00');
  });
});

describe('describePlan', () => {
  it('décrit le plan calculé', () => {
    const settings = base({ sessionLimit: 180 });
    expect(describePlan(planSession(settings), settings)).toBe(
      '5 focus de 25 min, avec 4 pauses — 2 h 35 au total.',
    );
  });

  it('prévient quand l enveloppe est trop courte', () => {
    const settings = base({ sessionLimit: 15 });
    expect(describePlan(planSession(settings), settings)).toContain('Trop court');
  });
});
