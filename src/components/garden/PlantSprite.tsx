import { useMemo } from 'react';
import { getPlantSprite, getSoilSprite } from '../../garden/plants';
import type { SpeciesId } from '../../garden/types';
import styles from './PlantSprite.module.css';

interface PlantSpriteProps {
  /** null = parcelle nue */
  species: SpeciesId | null;
  stage?: number;
  locked?: boolean;
  label?: string;
}

export function PlantSprite({ species, stage = 0, locked = false, label }: PlantSpriteProps) {
  const sprite = useMemo(
    () => (species ? getPlantSprite(species, stage) : getSoilSprite()),
    [species, stage],
  );

  return (
    <div className={`${styles.sprite} ${locked ? styles.locked : ''}`} role="img" aria-label={label}>
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
    </div>
  );
}
