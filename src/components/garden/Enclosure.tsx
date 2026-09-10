import { useMemo } from 'react';
import { plotsUnlocked, plotUnlockHours } from '../../garden/economy';
import { getPlantSprite, getSoilSprite } from '../../garden/plants';
import {
  SCENE,
  SLOTS,
  SLOT_SIZE,
  buildBackFence,
  buildFrontFence,
  buildDecor,
  buildGround,
  type ScenePixel,
} from '../../garden/scene';
import { SPECIES } from '../../garden/species';
import type { GardenState } from '../../garden/types';
import styles from './Enclosure.module.css';

function Pixels({ pixels }: { pixels: ScenePixel[] }) {
  return (
    <>
      {pixels.map((pixel, index) => (
        <rect
          key={index}
          x={pixel.x}
          y={pixel.y}
          width={pixel.w}
          height={pixel.h}
          fill={pixel.fill}
        />
      ))}
    </>
  );
}

interface EnclosureProps {
  garden: GardenState;
  selected: number | null;
  onSelect: (index: number) => void;
}

/** Le jardin vu comme un enclos continu : le sol, la clôture, puis les plantes. */
export function Enclosure({ garden, selected, onSelect }: EnclosureProps) {
  const open = plotsUnlocked(garden.focusSeconds);
  const ground = useMemo(buildGround, []);
  const backFence = useMemo(buildBackFence, []);
  const decor = useMemo(buildDecor, []);

  // la terre labouree vient du meme sprite que la motte des plantes : les deux
  // se superposent alors au pixel pres quand une graine est semee
  const tilled = useMemo(() => {
    const soil = getSoilSprite();
    return Array.from({ length: open }, (_, index) => {
      const slot = SLOTS[index];
      return soil.pixels.map((pixel) => ({
        x: slot.x + pixel.x,
        y: slot.y + pixel.y,
        w: 1,
        h: 1,
        fill: pixel.fill,
      }));
    }).flat();
  }, [open]);
  const frontFence = useMemo(buildFrontFence, []);

  const viewBox = `0 0 ${SCENE.width} ${SCENE.height}`;
  const percent = (value: number, total: number) => `${(value / total) * 100}%`;

  return (
    <div className={styles.enclosure}>
      <svg className={styles.layer} viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
        <Pixels pixels={ground} />
        <Pixels pixels={tilled} />
        <Pixels pixels={decor} />
        <Pixels pixels={backFence} />
      </svg>

      {SLOTS.map((slot, index) => {
        const plot = garden.plots[index];
        const unlocked = index < open;
        const sprite = plot ? getPlantSprite(plot.species, plot.stage) : null;
        const label = plot
          ? `${SPECIES[plot.species].name}, ${SPECIES[plot.species].stages[plot.stage]}`
          : unlocked
            ? 'Parcelle libre'
            : `Parcelle verrouillée, débloquée à ${plotUnlockHours(index)} h de focus`;

        return (
          <button
            type="button"
            key={index}
            className={[
              styles.slot,
              selected === index ? styles.selected : '',
              unlocked ? '' : styles.locked,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              left: percent(slot.x, SCENE.width),
              top: percent(slot.y, SCENE.height),
              width: percent(SLOT_SIZE, SCENE.width),
            }}
            disabled={!unlocked}
            aria-pressed={selected === index}
            aria-label={label}
            title={label}
            onClick={() => onSelect(index)}
          >
            {sprite ? (
              <svg viewBox={`0 0 ${sprite.width} ${sprite.height}`} xmlns="http://www.w3.org/2000/svg">
                {sprite.pixels.map((pixel) => (
                  <rect
                    key={`${pixel.x}-${pixel.y}`}
                    x={pixel.x}
                    y={pixel.y}
                    width={1}
                    height={1}
                    fill={pixel.fill}
                  />
                ))}
              </svg>
            ) : null}
          </button>
        );
      })}

      <svg
        className={`${styles.layer} ${styles.front}`}
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <Pixels pixels={frontFence} />
      </svg>
    </div>
  );
}
