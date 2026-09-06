import styles from './TitleBar.module.css';

/** Contrôles Electron, avec repli navigateur quand le preload est absent. */
const controls = {
  minimize: () => window.winCtl?.minimize(),
  maximize: () => window.winCtl?.maximize(),
  close: () => (window.winCtl ? window.winCtl.close() : window.close()),
};

export function TitleBar() {
  return (
    <div className={styles.bar}>
      <span className={styles.name}>POMODORO.EXE</span>
      <div className={styles.buttons}>
        <button type="button" className={styles.minimize} title="Réduire" aria-label="Réduire" onClick={controls.minimize} />
        <button type="button" className={styles.maximize} title="Agrandir" aria-label="Agrandir" onClick={controls.maximize} />
        <button type="button" className={styles.close} title="Fermer" aria-label="Fermer" onClick={controls.close} />
      </div>
    </div>
  );
}
