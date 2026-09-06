import styles from './TimerDisplay.module.css';

interface TimerDisplayProps {
  clock: string;
  label: string;
}

export function TimerDisplay({ clock, label }: TimerDisplayProps) {
  return (
    <>
      <div className={styles.time} role="timer" aria-live="off">
        {clock}
      </div>
      <div className={styles.label}>{label}</div>
    </>
  );
}
