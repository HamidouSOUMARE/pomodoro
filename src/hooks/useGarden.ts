import { useCallback, useRef, useState } from 'react';
import { SESSION_BONUS, type FocusReward } from '../garden/economy';
import {
  breakStreak,
  grantFocus,
  grantSessionBonus,
  growPlant,
  harvestPlant,
  plantSeed,
} from '../garden/reducer';
import { loadGarden, saveGarden } from '../garden/storage';
import type { GardenState, SpeciesId } from '../garden/types';

/** Dernier gain, affiché brièvement à l'écran. */
export interface RayonGain {
  /** identifiant unique pour relancer l'animation à chaque gain */
  id: number;
  reward: FocusReward | null;
  sessionBonus: number;
}

export interface UseGarden {
  garden: GardenState;
  lastGain: RayonGain | null;
  rewardFocus: (focusMinutes: number) => void;
  rewardSession: (clean: boolean) => void;
  penaliseSkip: () => void;
  buy: (species: SpeciesId) => void;
  grow: (plotIndex: number) => void;
  harvest: (plotIndex: number) => void;
  dismissGain: () => void;
}

export function useGarden(): UseGarden {
  const stateRef = useRef<GardenState>(loadGarden());
  const [garden, setGarden] = useState<GardenState>(stateRef.current);
  const [lastGain, setLastGain] = useState<RayonGain | null>(null);
  const gainId = useRef(0);

  const commit = useCallback(() => {
    saveGarden(stateRef.current);
    setGarden({ ...stateRef.current });
  }, []);

  const apply = useCallback(
    (transition: (state: GardenState) => GardenState) => {
      stateRef.current = transition(stateRef.current);
      commit();
    },
    [commit],
  );

  const rewardFocus = useCallback(
    (focusMinutes: number) => {
      const { state, reward } = grantFocus(stateRef.current, focusMinutes);
      stateRef.current = state;
      gainId.current += 1;
      setLastGain({ id: gainId.current, reward, sessionBonus: 0 });
      commit();
    },
    [commit],
  );

  const rewardSession = useCallback(
    (clean: boolean) => {
      // une session dont on a passe des focus ne merite pas la prime
      if (!clean) return;
      stateRef.current = grantSessionBonus(stateRef.current);
      gainId.current += 1;
      setLastGain({ id: gainId.current, reward: null, sessionBonus: SESSION_BONUS });
      commit();
    },
    [commit],
  );

  const penaliseSkip = useCallback(() => apply(breakStreak), [apply]);
  const buy = useCallback((species: SpeciesId) => apply((s) => plantSeed(s, species)), [apply]);
  const grow = useCallback((plotIndex: number) => apply((s) => growPlant(s, plotIndex)), [apply]);
  const harvest = useCallback((plotIndex: number) => apply((s) => harvestPlant(s, plotIndex)), [apply]);
  const dismissGain = useCallback(() => setLastGain(null), []);

  return {
    garden,
    lastGain,
    rewardFocus,
    rewardSession,
    penaliseSkip,
    buy,
    grow,
    harvest,
    dismissGain,
  };
}
