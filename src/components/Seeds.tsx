import styles from './Seeds.module.css';

interface SeedsProps {
  total: number;
  filled: number;
}

export function Seeds({ total, filled }: SeedsProps) {
  return (
    <div className={styles.seeds} title="Pomodoros complétés dans ce cycle">
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={`${styles.seed} ${index < filled ? styles.full : ''}`} />
      ))}
    </div>
  );
}
