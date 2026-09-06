import { PixelButton } from './PixelButton';
import styles from './Controls.module.css';

interface ControlsProps {
  running: boolean;
  sessionDone: boolean;
  onToggle: () => void;
  onReset: () => void;
  onSkip: () => void;
  onNewSession: () => void;
}

export function Controls({ running, sessionDone, onToggle, onReset, onSkip, onNewSession }: ControlsProps) {
  if (sessionDone) {
    return (
      <div className={styles.controls}>
        <PixelButton variant="accent" size="large" onClick={onNewSession}>
          Nouvelle session
        </PixelButton>
      </div>
    );
  }

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
