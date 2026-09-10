import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Controls } from './components/Controls';
import { FruitSprite } from './components/FruitSprite';
import { ModeTabs } from './components/ModeTabs';
import { SegmentBar } from './components/SegmentBar';
import { Seeds } from './components/Seeds';
import { SessionMeter } from './components/SessionMeter';
import { SettingsPanel } from './components/SettingsPanel';
import { GardenView } from './components/garden/GardenView';
import { Rayons } from './components/garden/RayonIcon';
import { TimerDisplay } from './components/TimerDisplay';
import { useGarden } from './hooks/useGarden';
import { usePomodoro, type PomodoroHandlers } from './hooks/usePomodoro';
import { useSettings } from './hooks/useSettings';
import { setVolume } from './lib/audio';
import { formatClock } from './lib/session';
import type { Mode } from './types';
import styles from './App.module.css';

const ACCENTS: Record<Mode, string> = {
  focus: 'var(--color-tomato)',
  short: 'var(--color-lemon)',
  long: 'var(--color-melon)',
};

const LABELS: Record<Mode, string> = {
  focus: 'Focus — on plante des tomates',
  short: 'Pause courte — respire',
  long: "Grande pause — tu l'as méritée",
};

const TITLE_ICONS: Record<Mode, string> = {
  focus: '🍅',
  short: '🍋',
  long: '🍉',
};

type View = 'minuteur' | 'jardin';

/** Combien de temps la bulle de gain reste affichée. */
const GAIN_DURATION_MS = 3200;

export function App() {
  const { settings, update } = useSettings();
  const {
    garden,
    lastGain,
    rewardFocus,
    rewardSession,
    penaliseSkip,
    buy,
    grow,
    harvest,
    dismissGain,
  } = useGarden();

  const handlers = useMemo<PomodoroHandlers>(
    () => ({
      onFocusDone: rewardFocus,
      onSessionDone: rewardSession,
      onFocusSkipped: penaliseSkip,
    }),
    [penaliseSkip, rewardFocus, rewardSession],
  );

  const timer = usePomodoro(settings, handlers);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [view, setView] = useState<View>('minuteur');
  const clock = formatClock(timer.remaining);

  // la bulle de gain s'efface d'elle-meme
  useEffect(() => {
    if (!lastGain) return undefined;
    const id = window.setTimeout(dismissGain, GAIN_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [dismissGain, lastGain]);

  const toggleView = useCallback(
    () => setView((current) => (current === 'minuteur' ? 'jardin' : 'minuteur')),
    [],
  );

  useEffect(() => {
    setVolume(settings.vol);
  }, [settings.vol]);

  useEffect(() => {
    document.title = `${clock} ${TITLE_ICONS[timer.mode]} Pomodoro`;
  }, [clock, timer.mode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSettingsOpen(false);
        return;
      }
      if (event.code !== 'Space') return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(target.tagName)) return;
      event.preventDefault();
      if (timer.sessionDone) timer.newSession();
      else timer.toggle();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [timer]);

  const stepRatio = timer.stepTotal === 0 ? 0 : 1 - timer.remaining / timer.stepTotal;

  return (
    <div className={styles.page} style={{ '--color-accent': ACCENTS[timer.mode] } as CSSProperties}>
      <header className={styles.topbar}>
        <h1 className={styles.brand}>{view === 'jardin' ? 'JARDIN' : 'POMODORO'}</h1>
        <div className={styles.topbarRight}>
          <span className={styles.rayons} title="Rayons disponibles">
            <Rayons amount={garden.rayons} />
          </span>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.viewToggle}`}
            onClick={toggleView}
            aria-label={view === 'jardin' ? 'Revenir au minuteur' : 'Ouvrir le jardin'}
          >
            {view === 'jardin' ? '⏱' : '🌱'}
          </button>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.gear}`}
            onClick={() => setSettingsOpen((open) => !open)}
            aria-expanded={settingsOpen}
            aria-controls="reglages"
            aria-label={settingsOpen ? 'Fermer les réglages' : 'Ouvrir les réglages'}
          >
            ⚙
          </button>
        </div>
      </header>

      {lastGain ? (
        <output className={styles.gain} key={lastGain.id}>
          {lastGain.reward ? (
            <>
              +<Rayons amount={lastGain.reward.base} />
              {lastGain.reward.streakBonus > 0 ? (
                <>
                  {' · '}Série ×{lastGain.reward.streak} +
                  <Rayons amount={lastGain.reward.streakBonus} />
                </>
              ) : null}
            </>
          ) : (
            <>
              Session bouclée +<Rayons amount={lastGain.sessionBonus} />
            </>
          )}
        </output>
      ) : null}

      <div className={`${styles.layout} ${view === 'jardin' ? styles.wide : ''}`}>
        {view === 'jardin' ? (
          <main className={styles.garden}>
            <GardenView garden={garden} onBuy={buy} onGrow={grow} onHarvest={harvest} />
          </main>
        ) : null}

        {view === 'minuteur' ? (
        <main className={styles.timer}>
          <p className={styles.tagline}>
            {settings.focus} min de focus · {settings.short} min de pause · grande pause tous les{' '}
            {settings.cycles} fruits
          </p>

          <ModeTabs current={timer.mode} onSelect={timer.selectMode} disabled={timer.sessionDone} />

          <FruitSprite mode={timer.mode} />

          <TimerDisplay
            clock={timer.sessionDone ? formatClock(0) : clock}
            label={timer.sessionDone ? 'Session terminée — repose-toi' : LABELS[timer.mode]}
          />

          <div className={styles.stepBar}>
            <SegmentBar ratio={timer.sessionDone ? 1 : stepRatio} title="Progression de l'étape" />
          </div>

          <Seeds total={settings.cycles} filled={timer.completed} />

          <Controls
            running={timer.running}
            sessionDone={timer.sessionDone}
            onToggle={timer.toggle}
            onReset={timer.resetStep}
            onSkip={timer.skip}
            onNewSession={timer.newSession}
          />

          {timer.plan ? (
            <SessionMeter
              plan={timer.plan}
              elapsed={timer.sessionElapsed}
              focusDone={timer.focusDone}
              done={timer.sessionDone}
            />
          ) : null}
        </main>
        ) : null}

        {settingsOpen ? (
          <button
            type="button"
            className={styles.scrim}
            aria-label="Fermer les réglages"
            onClick={() => setSettingsOpen(false)}
          />
        ) : null}

        <aside id="reglages" className={`${styles.settings} ${settingsOpen ? styles.open : ''}`}>
          <div className={styles.drawerBar}>
            <button
              type="button"
              className={styles.drawerClose}
              onClick={() => setSettingsOpen(false)}
              aria-label="Fermer les réglages"
            >
              ✕
            </button>
          </div>
          <SettingsPanel settings={settings} onChange={update} />
        </aside>
      </div>
    </div>
  );
}
