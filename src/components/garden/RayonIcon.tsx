import styles from './RayonIcon.module.css';

/**
 * Petit soleil en pixels, dessiné plutôt qu'écrit : le caractère ☀ n'existe
 * dans aucune des deux polices de l'app et retombe sur un glyphe minuscule.
 * `currentColor` lui fait suivre la couleur du texte qui l'entoure.
 */
const SUN = [
  '...x...',
  '.x.x.x.',
  '..xxx..',
  'xxxxxxx',
  '..xxx..',
  '.x.x.x.',
  '...x...',
] as const;

export function RayonIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 7 7" aria-hidden="true" focusable="false">
      {SUN.flatMap((row, y) =>
        [...row].map((cell, x) =>
          cell === 'x' ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
          ) : null,
        ),
      )}
    </svg>
  );
}

/** Montant suivi de l'icône, la forme utilisée partout dans le jardin. */
export function Rayons({ amount }: { amount: number }) {
  return (
    <span className={styles.amount}>
      {amount} <RayonIcon />
    </span>
  );
}
