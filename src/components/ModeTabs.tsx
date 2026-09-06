import type { Mode } from '../types';
import { PixelButton } from './PixelButton';
import styles from './ModeTabs.module.css';

const TABS: { mode: Mode; label: string }[] = [
  { mode: 'focus', label: 'Focus' },
  { mode: 'short', label: 'Pause' },
  { mode: 'long', label: 'Grande pause' },
];

interface ModeTabsProps {
  current: Mode;
  onSelect: (mode: Mode) => void;
  disabled?: boolean;
}

export function ModeTabs({ current, onSelect, disabled = false }: ModeTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Mode">
      {TABS.map(({ mode, label }) => (
        <PixelButton
          key={mode}
          role="tab"
          aria-selected={mode === current}
          variant={mode === current ? 'accent' : 'default'}
          disabled={disabled}
          onClick={() => onSelect(mode)}
        >
          {label}
        </PixelButton>
      ))}
    </div>
  );
}
