import { useCallback, useEffect, useRef, useState } from 'react';
import { playSound, unlockAudio } from '../lib/audio';
import { notifyStepDone } from '../lib/notify';
import { breakAfterFocus, durationFor } from '../lib/session';
import type { Mode, Settings } from '../types';

const TICK_MS = 250;

/**
 * État interne du minuteur. Il vit dans une ref pour que plusieurs transitions
 * puissent s'enchaîner entre deux rendus (réveil de veille, ticks rapprochés),
 * et il est recopié dans le state React à chaque changement visible.
 */
interface Engine {
  mode: Mode;
  running: boolean;
  /** secondes restantes sur l'étape en cours */
  remaining: number;
  /** focus terminés dans le cycle courant (les graines) */
  completed: number;
  /** horodatage de fin de l'étape, null quand le minuteur est à l'arrêt */
  endAt: number | null;
}

export interface PomodoroState {
  mode: Mode;
  running: boolean;
  remaining: number;
  /** durée totale de l'étape en cours, en secondes */
  stepTotal: number;
  completed: number;
}

export interface PomodoroActions {
  toggle: () => void;
  resetStep: () => void;
  skip: () => void;
  selectMode: (mode: Mode) => void;
}

function secondsLeft(endAt: number): number {
  return Math.max(0, Math.round((endAt - Date.now()) / 1000));
}

export function usePomodoro(settings: Settings): PomodoroState & PomodoroActions {
  // miroir synchrone : le moteur tourne dans des callbacks stables
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const engineRef = useRef<Engine>({
    mode: 'focus',
    running: false,
    remaining: durationFor('focus', settings),
    completed: 0,
    endAt: null,
  });

  const [snapshot, setSnapshot] = useState<Engine>(engineRef.current);
  const commit = useCallback(() => setSnapshot({ ...engineRef.current }), []);

  const openStep = useCallback((mode: Mode, seconds: number, autostart: boolean) => {
    const engine = engineRef.current;
    engine.mode = mode;
    engine.remaining = seconds;
    engine.endAt = autostart ? Date.now() + seconds * 1000 : null;
    engine.running = autostart;
  }, []);

  /** Clôture l'étape en cours puis enchaîne sur la suivante. */
  const finish = useCallback(
    () => {
      const engine = engineRef.current;
      const current = settingsRef.current;
      const finished = engine.mode;

      playSound(current.sound, current.vol);

      if (finished === 'focus') engine.completed += 1;
      else if (finished === 'long') engine.completed = 0;

      notifyStepDone(finished, current.notif);

      const next: Mode = finished === 'focus' ? breakAfterFocus(engine.completed, current) : 'focus';
      openStep(next, durationFor(next, current), current.auto);
    },
    [openStep],
  );

  const tick = useCallback(() => {
    const engine = engineRef.current;
    if (!engine.running || engine.endAt === null) return;

    const previous = engine.remaining;
    engine.remaining = secondsLeft(engine.endAt);

    if (engine.remaining <= 0) {
      finish();
      commit();
      return;
    }
    if (engine.remaining !== previous) commit();
  }, [commit, finish]);

  useEffect(() => {
    if (!snapshot.running) return undefined;
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [snapshot.running, tick]);

  // une durée modifiée dans les réglages s'applique à l'étape en cours si elle est à l'arrêt
  const durationsKey = `${settings.focus}|${settings.short}|${settings.long}`;
  const previousDurations = useRef(durationsKey);
  useEffect(() => {
    if (previousDurations.current === durationsKey) return;
    previousDurations.current = durationsKey;

    const engine = engineRef.current;
    if (engine.running) return;
    engine.remaining = durationFor(engine.mode, settingsRef.current);
    commit();
  }, [commit, durationsKey]);

  const toggle = useCallback(() => {
    unlockAudio();
    const engine = engineRef.current;

    if (engine.running) {
      if (engine.endAt !== null) engine.remaining = secondsLeft(engine.endAt);
      engine.endAt = null;
      engine.running = false;
    } else {
      engine.endAt = Date.now() + engine.remaining * 1000;
      engine.running = true;
    }
    commit();
  }, [commit]);

  const resetStep = useCallback(() => {
    const engine = engineRef.current;
    engine.remaining = durationFor(engine.mode, settingsRef.current);
    engine.endAt = engine.running ? Date.now() + engine.remaining * 1000 : null;
    commit();
  }, [commit]);

  const skip = useCallback(() => {
    engineRef.current.endAt = null;
    finish();
    commit();
  }, [commit, finish]);

  const selectMode = useCallback(
    (mode: Mode) => {
      openStep(mode, durationFor(mode, settingsRef.current), false);
      commit();
    },
    [commit, openStep],
  );

  const stepTotal = durationFor(snapshot.mode, settings);

  return {
    mode: snapshot.mode,
    running: snapshot.running,
    remaining: snapshot.remaining,
    stepTotal,
    completed: snapshot.completed,
    toggle,
    resetStep,
    skip,
    selectMode,
  };
}
