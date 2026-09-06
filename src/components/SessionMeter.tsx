import { formatClock, formatMinutes, type SessionPlan } from '../lib/session';
import { SegmentBar } from './SegmentBar';
import styles from './SessionMeter.module.css';

interface SessionMeterProps {
  plan: SessionPlan;
  elapsed: number;
  focusDone: number;
  done: boolean;
}

export function SessionMeter({ plan, elapsed, focusDone, done }: SessionMeterProps) {
  const capped = Math.min(elapsed, plan.plannedSeconds);
  const ratio = plan.plannedSeconds === 0 ? 0 : capped / plan.plannedSeconds;
  const leftMinutes = Math.max(0, Math.round((plan.plannedSeconds - capped) / 60));
  const withHours = plan.plannedSeconds >= 3600;

  return (
    <section className={`${styles.meter} ${done ? styles.done : ''}`}>
      <div className={styles.head}>
        <span className={styles.title}>{done ? 'Session terminée' : 'Session'}</span>
        <span className={styles.clock}>
          {formatClock(capped, withHours)} / {formatClock(plan.plannedSeconds, withHours)}
        </span>
      </div>

      <SegmentBar ratio={ratio} soft={!done} title="Progression de la session" />

      <p className={styles.detail}>
        {done
          ? `${plan.focusCount} focus bouclés — la tomate est fière de toi.`
          : `Focus ${Math.min(focusDone + 1, plan.focusCount)} / ${plan.focusCount} · il reste ${formatMinutes(leftMinutes)}`}
      </p>
    </section>
  );
}
