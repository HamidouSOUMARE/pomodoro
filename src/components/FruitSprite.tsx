import { useMemo } from 'react';
import { getSprite } from '../lib/sprites';
import type { Mode } from '../types';
import styles from './FruitSprite.module.css';

interface FruitSpriteProps {
  mode: Mode;
}

export function FruitSprite({ mode }: FruitSpriteProps) {
  const sprite = useMemo(() => getSprite(mode), [mode]);

  return (
    <div className={styles.box} aria-hidden="true">
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
