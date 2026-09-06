import { PixelButton } from './PixelButton';
import styles from './Controls.module.css';

interface ControlsProps {
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function Controls({ running, onToggle, onReset, onSkip }: ControlsProps) {
  return (
    <div className={styles.controls}>
      <PixelButton onClick={onReset} title="Réinitialiser l'étape" aria-label="Réinitialiser l'étape">
        ↺
      </PixelButton>
      <PixelButton variant="accent" size="large" onClick={onToggle}>
        {running ? 'Pause' : 'Démarrer'}
      </PixelButton>
      <PixelButton onClick={onSkip} title="Étape suivante" aria-label="Étape suivante">
        ⏭
      </PixelButton>
    </div>
  );
}
