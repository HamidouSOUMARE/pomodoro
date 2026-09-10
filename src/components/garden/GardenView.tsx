import { useState } from 'react';
import {
  growthCostFor,
  isSpeciesUnlocked,
  milestones,
  nextMilestone,
  plotsUnlocked,
} from '../../garden/economy';
import { collectionSize } from '../../garden/reducer';
import { RARITY_LABEL, SPECIES, SPECIES_LIST, totalCost } from '../../garden/species';
import { FINAL_STAGE, type GardenState, type Rarity, type SpeciesId } from '../../garden/types';
import { PixelButton } from '../PixelButton';
import { Enclosure } from './Enclosure';
import { PlantSprite } from './PlantSprite';
import { Rayons } from './RayonIcon';
import { TestBench } from './TestBench';
import styles from './GardenView.module.css';

const RARITY_CLASS: Record<Rarity, string> = {
  commune: styles.commune,
  'peu-commune': styles.peuCommune,
  rare: styles.rare,
  legendaire: styles.legendaire,
};

function formatHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${String(minutes).padStart(2, '0')}`;
}

interface GardenViewProps {
  garden: GardenState;
  onBuy: (species: SpeciesId) => void;
  onGrow: (plotIndex: number) => void;
  onHarvest: (plotIndex: number) => void;
  onGrantRayons: (amount: number) => void;
  onAddFocusTime: (seconds: number) => void;
  onReset: () => void;
}

export function GardenView({
  garden,
  onBuy,
  onGrow,
  onHarvest,
  onGrantRayons,
  onAddFocusTime,
  onReset,
}: GardenViewProps) {
  const openPlots = plotsUnlocked(garden.focusSeconds);
  const goal = nextMilestone(garden.focusSeconds);
  const hours = garden.focusSeconds / 3600;
  const hasFreePlot = garden.plots.slice(0, openPlots).some((plot) => plot === null);
  const harvested = collectionSize(garden);
  const [selected, setSelected] = useState(0);
  const selectedPlot = garden.plots[selected] ?? null;
  const selectedCost = selectedPlot ? growthCostFor(selectedPlot.species, selectedPlot.stage) : null;
  const selectedMature = selectedPlot?.stage === FINAL_STAGE;

  return (
    <div className={styles.view}>
      <section className={styles.summary}>
        <div className={styles.summaryTop}>
          <span className={styles.rayons}>
            <Rayons amount={garden.rayons} /> rayons
          </span>
          <span className={styles.focusTime}>{formatHours(garden.focusSeconds)} de focus</span>
        </div>
        <p className={styles.nextGoal}>
          {goal
            ? `Prochain palier à ${goal.hours} h : ${goal.label}`
            : 'Tous les paliers sont franchis. Le jardin est complet.'}
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>L&apos;enclos</h2>
        <Enclosure garden={garden} selected={selected} onSelect={setSelected} />

        <div className={styles.detail}>
          {selectedPlot ? (
            <>
              <span className={styles.detailName}>{SPECIES[selectedPlot.species].name}</span>
              <span className={`${styles.detailStage} ${selectedMature ? styles.mature : ''}`}>
                {SPECIES[selectedPlot.species].stages[selectedPlot.stage]}
              </span>
              {selectedMature ? (
                <PixelButton variant="accent" onClick={() => onHarvest(selected)}>
                  Cueillir
                </PixelButton>
              ) : (
                <>
                  <span className={styles.detailCost}>
                    Arrosage <Rayons amount={selectedCost ?? 0} />
                  </span>
                  <PixelButton
                    variant={selectedCost !== null && garden.rayons >= selectedCost ? 'accent' : 'default'}
                    disabled={selectedCost === null || garden.rayons < selectedCost}
                    onClick={() => onGrow(selected)}
                  >
                    Arroser
                  </PixelButton>
                </>
              )}
            </>
          ) : (
            <span className={styles.detailStage}>
              Parcelle libre — choisis une graine ci-dessous.
            </span>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Graines</h2>
        <div className={styles.shop}>
          {SPECIES_LIST.map((species) => {
            const unlocked = isSpeciesUnlocked(species, garden.focusSeconds);
            const affordable = garden.rayons >= species.seedPrice;
            const canSow = unlocked && affordable && hasFreePlot;

            return (
              <div className={styles.seed} key={species.id}>
                <div className={styles.seedThumb}>
                  <PlantSprite species={species.id} stage={FINAL_STAGE} locked={!unlocked} />
                </div>
                <div className={styles.seedInfo}>
                  <span className={styles.seedName}>
                    {species.name}{' '}
                    <span className={`${styles.rarity} ${RARITY_CLASS[species.rarity]}`}>
                      {RARITY_LABEL[species.rarity]}
                    </span>
                  </span>
                  <span className={styles.seedMeta}>
                    {unlocked ? (
                      <>
                        <Rayons amount={species.growthCost} /> par arrosage ·{' '}
                        <Rayons amount={totalCost(species)} /> au total
                      </>
                    ) : (
                      `Débloquée à ${species.unlockHours} h de focus`
                    )}
                  </span>
                </div>
                <PixelButton
                  variant={canSow ? 'accent' : 'default'}
                  disabled={!canSow}
                  onClick={() => onBuy(species.id)}
                  title={
                    !unlocked
                      ? 'Espèce pas encore débloquée'
                      : !hasFreePlot
                        ? 'Aucune parcelle libre'
                        : undefined
                  }
                >
                  <Rayons amount={species.seedPrice} />
                </PixelButton>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Collection · {harvested} cueillie{harvested > 1 ? 's' : ''}
        </h2>
        <div className={styles.collection}>
          {SPECIES_LIST.map((species) => {
            const count = garden.collection[species.id] ?? 0;
            return (
              <div
                className={`${styles.collected} ${count === 0 ? styles.missing : ''}`}
                key={species.id}
                title={species.name}
              >
                <PlantSprite species={species.id} stage={FINAL_STAGE} locked={count === 0} />
                <span className={styles.collectedCount}>
                  {count > 0 ? `×${count}` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Paliers</h2>
        <div className={styles.milestones}>
          {milestones().map((milestone) => (
            <div
              className={`${styles.milestone} ${hours >= milestone.hours ? styles.reached : ''}`}
              key={milestone.hours}
            >
              <span className={styles.milestoneHours}>{milestone.hours} h</span>
              <span>{milestone.label}</span>
            </div>
          ))}
        </div>
      </section>

      {__TEST_BENCH__ ? (
        <TestBench
          onGrantRayons={onGrantRayons}
          onAddFocusTime={onAddFocusTime}
          onReset={onReset}
        />
      ) : null}
    </div>
  );
}
