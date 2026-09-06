import styles from './SegmentBar.module.css';

interface SegmentBarProps {
  /** avancement entre 0 et 1 */
  ratio: number;
  segments?: number;
  /** variante discrète pour la progression de session */
  soft?: boolean;
  title?: string;
}

const DEFAULT_SEGMENTS = 20;

export function SegmentBar({ ratio, segments = DEFAULT_SEGMENTS, soft = false, title }: SegmentBarProps) {
  const filled = Math.round(segments * Math.min(1, Math.max(0, ratio)));

  return (
    <div
      className={styles.bar}
      title={title}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(Math.min(1, Math.max(0, ratio)) * 100)}
      aria-label={title}
    >
      {Array.from({ length: segments }, (_, index) => (
        <span
          key={index}
          className={[styles.segment, soft ? styles.soft : '', index < filled ? styles.on : '']
            .filter(Boolean)
            .join(' ')}
        />
      ))}
    </div>
  );
}
