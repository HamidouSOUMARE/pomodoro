import { describe, expect, it } from 'vitest';
import { breakAfterFocus, formatClock } from './session';
import { DEFAULT_SETTINGS, type Settings } from '../types';

const base = (overrides: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...overrides });

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

describe('formatClock', () => {
  it('passe en heures au-delà de 60 minutes', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(1500)).toBe('25:00');
    expect(formatClock(9300)).toBe('2:35:00');
  });
});
