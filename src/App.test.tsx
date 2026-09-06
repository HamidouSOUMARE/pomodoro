// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('App', () => {
  it('démarre sur un focus de 25 min avec le plan de session par défaut', () => {
    render(<App />);

    expect(screen.getByRole('timer').textContent).toBe('25:00');
    expect(screen.getByText(/Focus — on plante des tomates/)).toBeTruthy();
    expect(screen.getByText(/5 focus de 25 min, avec 4 pauses — 2 h 35 au total\./)).toBeTruthy();
    expect(screen.getByText(/Focus 1 \/ 5 · il reste 2 h 35/)).toBeTruthy();
  });

  it('décompte le temps une fois démarré', () => {
    vi.useFakeTimers();
    try {
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByRole('timer').textContent).toBe('24:57');
      expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('ouvre et ferme le tiroir de réglages', () => {
    render(<App />);
    const gear = screen.getByRole('button', { name: 'Ouvrir les réglages' });
    expect(gear.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(gear);
    expect(screen.getByRole('button', { name: 'Fermer les réglages', expanded: true })).toBeTruthy();

    // dans l'ordre : l'engrenage, le voile, puis la croix du tiroir
    const closers = screen.getAllByRole('button', { name: 'Fermer les réglages' });
    fireEvent.click(closers[closers.length - 1]);
    expect(screen.getByRole('button', { name: 'Ouvrir les réglages' })).toBeTruthy();
  });

  it('recalcule le plan quand on change la durée totale de session', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Augmenter durée totale de la session' }));

    expect(screen.getByText('3 h 15')).toBeTruthy();
    expect(screen.getByText(/6 focus de 25 min, avec 5 pauses — 3 h 05 au total\./)).toBeTruthy();
  });

  it('bascule sur une session illimitée et masque le compteur', () => {
    render(<App />);
    const decrease = screen.getByRole('button', { name: 'Diminuer durée totale de la session' });

    for (let i = 0; i < 12; i += 1) fireEvent.click(decrease);

    expect(screen.getByText('Illimitée')).toBeTruthy();
    expect(screen.queryByText(/il reste/)).toBeNull();
  });

  it('enchaîne les étapes et termine la session quand l enveloppe est épuisée', () => {
    vi.useFakeTimers();
    try {
      window.localStorage.setItem(
        'pomodoro-settings',
        JSON.stringify({ focus: 1, short: 1, long: 1, cycles: 4, sessionLimit: 3, auto: true }),
      );
      render(<App />);

      // 2 focus d'1 min séparés d'une pause d'1 min tiennent dans l'enveloppe de 3 min
      expect(screen.getByText(/2 focus de 1 min, avec 1 pause — 3 min au total\./)).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(screen.getByText(/Pause courte — respire/)).toBeTruthy();

      act(() => {
        vi.advanceTimersByTime(120_000);
      });
      expect(screen.getByText(/Session terminée — repose-toi/)).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Nouvelle session' })).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});
