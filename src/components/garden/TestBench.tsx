import { Rayons } from './RayonIcon';
import styles from './TestBench.module.css';

interface TestBenchProps {
  onGrantRayons: (amount: number) => void;
  onAddFocusTime: (seconds: number) => void;
  onReset: () => void;
}

const RAYON_STEPS = [100, 500, 2000];
const HOUR_STEPS = [1, 5, 20];

/**
 * Raccourcis pour éprouver le jardin sans y passer des heures.
 * Vite le retire du bundle de production : voir `__TEST_BENCH__`.
 */
export function TestBench({ onGrantRayons, onAddFocusTime, onReset }: TestBenchProps) {
  return (
    <section className={styles.bench}>
      <h2 className={styles.title}>Banc d&apos;essai</h2>
      <p className={styles.note}>
        Raccourcis de test, absents de la version en production.
      </p>

      <div className={styles.buttons}>
        {RAYON_STEPS.map((amount) => (
          <button
            type="button"
            className={styles.button}
            key={amount}
            onClick={() => onGrantRayons(amount)}
          >
            +<Rayons amount={amount} />
          </button>
        ))}
      </div>

      <div className={styles.buttons}>
        {HOUR_STEPS.map((hours) => (
          <button
            type="button"
            className={styles.button}
            key={hours}
            onClick={() => onAddFocusTime(hours * 3600)}
          >
            +{hours} h de focus
          </button>
        ))}
      </div>

      <div className={styles.buttons}>
        <button
          type="button"
          className={`${styles.button} ${styles.danger}`}
          onClick={onReset}
        >
          Vider le jardin
        </button>
      </div>
    </section>
  );
}
