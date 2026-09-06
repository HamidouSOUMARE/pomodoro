import { useId, useState, type ChangeEvent } from 'react';
import { hasCustomSound, loadCustomSound, playSound, unlockAudio } from '../lib/audio';
import { requestNotificationPermission } from '../lib/notify';
import { LIMITS, type Settings, type SoundName } from '../types';
import styles from './SettingsPanel.module.css';

const SOUNDS: { value: Exclude<SoundName, 'custom'>; label: string }[] = [
  { value: 'bell', label: 'Cloche' },
  { value: 'marimba', label: 'Marimba' },
  { value: 'ding', label: 'Ding' },
  { value: 'chirp', label: 'Oiseau' },
];

interface SettingsPanelProps {
  settings: Settings;
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

interface NumberFieldProps {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function NumberField({ label, hint, value, min, max, onChange }: NumberFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState<string>(String(value));

  const commit = (raw: string) => {
    const parsed = Number(raw);
    const next = Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : min;
    setDraft(String(next));
    onChange(next);
  };

  return (
    <div className={styles.row}>
      <label htmlFor={id}>
        {label} {hint ? <span className={styles.hint}>({hint})</span> : null}
      </label>
      <input
        id={id}
        className={styles.number}
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit(event.currentTarget.value);
        }}
      />
    </div>
  );
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const [soundFileLabel, setSoundFileLabel] = useState('Tu peux importer ton propre son (mp3/wav).');
  const [customLoaded, setCustomLoaded] = useState(hasCustomSound);

  const handleNotif = (event: ChangeEvent<HTMLInputElement>) => {
    onChange('notif', event.target.checked);
    if (event.target.checked) requestNotificationPermission();
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await loadCustomSound(file);
      setCustomLoaded(true);
      onChange('sound', 'custom');
      setSoundFileLabel(`Son importé : ${file.name} (valable pour cette session)`);
      playSound('custom', settings.vol);
    } catch {
      setSoundFileLabel('Format non reconnu — essaie un mp3 ou un wav.');
    }
  };

  return (
    <section className={styles.panel}>
      <h2>Réglages</h2>

      <NumberField
        label="Durée focus"
        hint="classique : 25"
        value={settings.focus}
        min={LIMITS.focus.min}
        max={LIMITS.focus.max}
        onChange={(value) => onChange('focus', value)}
      />
      <NumberField
        label="Pause courte"
        hint="classique : 5"
        value={settings.short}
        min={LIMITS.short.min}
        max={LIMITS.short.max}
        onChange={(value) => onChange('short', value)}
      />
      <NumberField
        label="Grande pause"
        hint="15–30"
        value={settings.long}
        min={LIMITS.long.min}
        max={LIMITS.long.max}
        onChange={(value) => onChange('long', value)}
      />
      <NumberField
        label="Focus avant la grande pause"
        value={settings.cycles}
        min={LIMITS.cycles.min}
        max={LIMITS.cycles.max}
        onChange={(value) => onChange('cycles', value)}
      />

      <div className={styles.divider} />

      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={settings.auto}
          onChange={(event) => onChange('auto', event.target.checked)}
        />
        Enchaîner automatiquement les étapes
      </label>
      <label className={styles.toggle}>
        <input type="checkbox" checked={settings.notif} onChange={handleNotif} />
        Notification système à la fin d&apos;une étape
      </label>

      <div className={styles.divider} />

      <div className={styles.soundLabel}>Son de fin</div>
      <div className={styles.soundRow}>
        <select
          className={styles.select}
          value={settings.sound}
          aria-label="Son de fin"
          onChange={(event) => onChange('sound', event.target.value as SoundName)}
        >
          {SOUNDS.map((sound) => (
            <option key={sound.value} value={sound.value}>
              {sound.label}
            </option>
          ))}
          <option value="custom" disabled={!customLoaded}>
            Son importé
          </option>
        </select>
        <button
          type="button"
          className={styles.mini}
          onClick={() => {
            unlockAudio();
            playSound(settings.sound, settings.vol);
          }}
        >
          ▶ écouter
        </button>
        <label className={styles.mini} htmlFor="soundFile">
          📁 importer…
        </label>
        <input
          id="soundFile"
          className={styles.fileInput}
          type="file"
          accept="audio/*"
          onChange={(event) => {
            void handleFile(event);
          }}
        />
      </div>
      <span className={styles.fileLabel}>{soundFileLabel}</span>

      <div className={styles.divider} />

      <div className={styles.row}>
        <label htmlFor="volume">Volume</label>
        <input
          id="volume"
          className={styles.range}
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.vol}
          onChange={(event) => onChange('vol', Number(event.target.value))}
        />
      </div>
    </section>
  );
}
