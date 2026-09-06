import { useEffect, type CSSProperties } from 'react';
import { Controls } from './components/Controls';
import { FruitSprite } from './components/FruitSprite';
import { ModeTabs } from './components/ModeTabs';
import { SegmentBar } from './components/SegmentBar';
import { Seeds } from './components/Seeds';
import { SessionMeter } from './components/SessionMeter';
import { SettingsPanel } from './components/SettingsPanel';
import { TimerDisplay } from './components/TimerDisplay';
import { TitleBar } from './components/TitleBar';
import { usePomodoro } from './hooks/usePomodoro';
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

export function App() {
  const { settings, update } = useSettings();
  const timer = usePomodoro(settings);
  const clock = formatClock(timer.remaining);

  useEffect(() => {
    setVolume(settings.vol);
  }, [settings.vol]);

  useEffect(() => {
    document.title = `${clock} ${TITLE_ICONS[timer.mode]} POMODORO.EXE`;
  }, [clock, timer.mode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
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
    <div className={styles.shell} style={{ '--color-accent': ACCENTS[timer.mode] } as CSSProperties}>
      <TitleBar />

      <main className={styles.app}>
        <h1 className={styles.title}>POMODORO</h1>
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

        <SettingsPanel settings={settings} onChange={update} />
      </main>
    </div>
  );
}
