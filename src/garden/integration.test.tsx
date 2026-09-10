// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

/** Règle une session courte pour boucler vite en horloge simulée. */
function useShortSession() {
  window.localStorage.setItem(
    'pomodoro-settings',
    JSON.stringify({ focus: 1, short: 1, long: 1, cycles: 4, sessionLimit: 3, auto: true }),
  );
}

const rayonsInTopbar = () =>
  Number(screen.getByTitle('Rayons disponibles').textContent?.replace(/\D/g, ''));

describe('minuteur et jardin', () => {
  it('ne donne aucun rayon avant le premier focus', () => {
    render(<App />);
    expect(rayonsInTopbar()).toBe(0);
  });

  it('credite les rayons quand un focus va au bout', () => {
    vi.useFakeTimers();
    try {
      useShortSession();
      render(<App />);

      fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
      act(() => {
        vi.advanceTimersByTime(60_000);
      });

      // un focus d'une minute = 1 rayon
      expect(rayonsInTopbar()).toBe(1);
      expect(screen.getByRole('status').textContent).toContain('+');
    } finally {
      vi.useRealTimers();
    }
  });

  it('ne donne rien pour un focus passe, et prive de la prime de session', () => {
    vi.useFakeTimers();
    try {
      useShortSession();
      render(<App />);

      // on passe le premier focus : l'enchainement automatique relance seul
      fireEvent.click(screen.getByRole('button', { name: 'Étape suivante' }));
      expect(rayonsInTopbar()).toBe(0);

      act(() => {
        vi.advanceTimersByTime(180_000);
      });

      expect(screen.getByText('Session terminée — repose-toi')).toBeTruthy();
      // le second focus rapporte son rayon, mais pas la prime des 40
      expect(rayonsInTopbar()).toBeLessThan(40);
    } finally {
      vi.useRealTimers();
    }
  });

  it('verse la prime quand la session est bouclee sans rien passer', () => {
    vi.useFakeTimers();
    try {
      useShortSession();
      render(<App />);

      fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
      act(() => {
        vi.advanceTimersByTime(180_000);
      });

      expect(screen.getByText('Session terminée — repose-toi')).toBeTruthy();
      // 2 focus d'une minute + la prime de session
      expect(rayonsInTopbar()).toBe(2 + 40);
    } finally {
      vi.useRealTimers();
    }
  });

  it('permet de semer puis d arroser depuis le jardin', () => {
    window.localStorage.setItem(
      'pomodoro-jardin',
      JSON.stringify({ rayons: 100, focusSeconds: 0, streak: 0, lifetimeRayons: 100, plots: [], collection: {} }),
    );
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le jardin' }));
    expect(screen.getByText(/Prochain palier/)).toBeTruthy();

    // la paquerette coute 30
    fireEvent.click(screen.getAllByRole('button', { name: /30/ })[0]);
    expect(rayonsInTopbar()).toBe(70);
    expect(screen.getByText('Graine semée')).toBeTruthy();
    // la parcelle semee est bien celle qui apparait dans l'enclos
    expect(screen.getByRole('button', { name: /Pâquerette, Graine semée/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Arroser' }));
    expect(rayonsInTopbar()).toBe(58);
    expect(screen.getByText('Pousse')).toBeTruthy();
  });

  it('range la plante dans la collection une fois cueillie', () => {
    window.localStorage.setItem(
      'pomodoro-jardin',
      JSON.stringify({
        rayons: 0,
        focusSeconds: 0,
        streak: 0,
        lifetimeRayons: 0,
        plots: [{ species: 'paquerette', stage: 3 }],
        collection: {},
      }),
    );
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le jardin' }));

    expect(screen.getByRole('heading', { name: /0 cueillie/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cueillir' }));
    expect(screen.getByRole('heading', { name: /1 cueillie/ })).toBeTruthy();
    expect(screen.getByText(/Parcelle libre/)).toBeTruthy();
  });
});
