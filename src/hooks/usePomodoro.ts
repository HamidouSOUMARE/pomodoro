import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { playSound, unlockAudio } from '../lib/audio';
import { SESSION_DONE_MESSAGE, notify, notifyStepDone } from '../lib/notify';
import { breakAfterFocus, durationFor, planSession, type SessionPlan } from '../lib/session';
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
  /** focus terminés depuis le début de la session */
  focusDone: number;
  /** secondes consommées par les étapes déjà closes */
  elapsedBefore: number;
  sessionDone: boolean;
  /** aucun focus n'a été passé depuis le début de la session */
  sessionClean: boolean;
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
  focusDone: number;
  /** secondes consommées dans la session, étape en cours comprise */
  sessionElapsed: number;
  sessionDone: boolean;
  plan: SessionPlan | null;
}

/**
 * Evenements emis par le minuteur. Le jardin s'y branche pour crediter les
 * rayons ; le minuteur, lui, ne sait rien du jardin.
 */
export interface PomodoroHandlers {
  /** un focus est alle jusqu'au bout */
  onFocusDone?: (focusMinutes: number) => void;
  /** l'enveloppe de session est bouclee ; `clean` = aucun focus passe */
  onSessionDone?: (clean: boolean) => void;
  /** un focus a ete passe avant la fin */
  onFocusSkipped?: () => void;
}

export interface PomodoroActions {
  toggle: () => void;
  resetStep: () => void;
  skip: () => void;
  selectMode: (mode: Mode) => void;
  newSession: () => void;
}

function secondsLeft(endAt: number): number {
  return Math.max(0, Math.round((endAt - Date.now()) / 1000));
}

export function usePomodoro(
  settings: Settings,
  handlers: PomodoroHandlers = {},
): PomodoroState & PomodoroActions {
  const plan = useMemo(() => planSession(settings), [settings]);

  // miroirs synchrones : le moteur tourne dans des callbacks stables
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const planRef = useRef(plan);
  planRef.current = plan;
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const engineRef = useRef<Engine>({
    mode: 'focus',
    running: false,
    remaining: durationFor('focus', settings),
    completed: 0,
    focusDone: 0,
    elapsedBefore: 0,
    sessionDone: false,
    sessionClean: true,
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

  /** Clôture l'étape en cours puis enchaîne, ou termine la session. */
  const finish = useCallback(
    (consumedSeconds: number, natural: boolean) => {
      const engine = engineRef.current;
      const current = settingsRef.current;
      const finished = engine.mode;

      playSound(current.sound, current.vol);

      engine.elapsedBefore += consumedSeconds;
      if (finished === 'focus') {
        engine.focusDone += 1;
        engine.completed += 1;
        if (natural) {
          handlersRef.current.onFocusDone?.(durationFor('focus', current) / 60);
        } else {
          engine.sessionClean = false;
          handlersRef.current.onFocusSkipped?.();
        }
      } else if (finished === 'long') {
        engine.completed = 0;
      }

      const sessionPlan = planRef.current;
      if (sessionPlan !== null && engine.focusDone >= sessionPlan.focusCount) {
        notify(SESSION_DONE_MESSAGE, current.notif);
        engine.running = false;
        engine.endAt = null;
        engine.remaining = 0;
        engine.sessionDone = true;
        handlersRef.current.onSessionDone?.(engine.sessionClean);
        return;
      }

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
      finish(durationFor(engine.mode, settingsRef.current), true);
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
    if (engine.running || engine.sessionDone) return;
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
    const engine = engineRef.current;
    const total = durationFor(engine.mode, settingsRef.current);
    const left = engine.endAt === null ? engine.remaining : secondsLeft(engine.endAt);
    engine.endAt = null;
    finish(total - left, false);
    commit();
  }, [commit, finish]);

  const selectMode = useCallback(
    (mode: Mode) => {
      openStep(mode, durationFor(mode, settingsRef.current), false);
      commit();
    },
    [commit, openStep],
  );

  const newSession = useCallback(() => {
    const engine = engineRef.current;
    engine.completed = 0;
    engine.focusDone = 0;
    engine.elapsedBefore = 0;
    engine.sessionDone = false;
    engine.sessionClean = true;
    openStep('focus', durationFor('focus', settingsRef.current), false);
    commit();
  }, [commit, openStep]);

  const stepTotal = durationFor(snapshot.mode, settings);
  const sessionElapsed = snapshot.sessionDone
    ? snapshot.elapsedBefore
    : snapshot.elapsedBefore + (stepTotal - snapshot.remaining);

  return {
    mode: snapshot.mode,
    running: snapshot.running,
    remaining: snapshot.remaining,
    stepTotal,
    completed: snapshot.completed,
    focusDone: snapshot.focusDone,
    sessionElapsed,
    sessionDone: snapshot.sessionDone,
    plan,
    toggle,
    resetStep,
    skip,
    selectMode,
    newSession,
  };
}
