import type { SoundName } from '../types';

type WindowWithAudio = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;
let masterGain: GainNode | null = null;
let customBuffer: AudioBuffer | null = null;

function getContext(): AudioContext {
  if (!context) {
    const win = window as WindowWithAudio;
    const Ctor = window.AudioContext ?? win.webkitAudioContext;
    if (!Ctor) throw new Error('Web Audio non disponible sur cette plateforme.');
    context = new Ctor();
  }
  return context;
}

function getMaster(volume: number): GainNode {
  const ctx = getContext();
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
  }
  masterGain.gain.value = volume;
  return masterGain;
}

function envelope(gain: GainNode, start: number, attack: number, decay: number, peak: number): void {
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, start + attack + decay);
}

function tone(
  freq: number,
  type: OscillatorType,
  start: number,
  attack: number,
  decay: number,
  peak: number,
  volume: number,
): void {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(getMaster(volume));
  envelope(gain, start, attack, decay, peak);
  osc.start(start);
  osc.stop(start + attack + decay + 0.05);
}

const RECIPES: Record<Exclude<SoundName, 'custom'>, (volume: number) => void> = {
  bell(volume) {
    const t = getContext().currentTime;
    [880, 1320, 1760].forEach((f, i) => tone(f, 'sine', t, 0.01, 1.6 - i * 0.3, 0.5 / (i + 1), volume));
  },
  marimba(volume) {
    const t = getContext().currentTime;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 'sine', t + i * 0.16, 0.005, 0.5, 0.55, volume));
  },
  ding(volume) {
    const t = getContext().currentTime;
    tone(1568, 'triangle', t, 0.005, 0.7, 0.6, volume);
    tone(3136, 'sine', t, 0.005, 0.4, 0.15, volume);
  },
  chirp(volume) {
    const ctx = getContext();
    const t = ctx.currentTime;
    for (let i = 0; i < 3; i += 1) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = t + i * 0.25;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, start);
      osc.frequency.exponentialRampToValueAtTime(2600, start + 0.12);
      osc.connect(gain);
      gain.connect(getMaster(volume));
      envelope(gain, start, 0.01, 0.18, 0.4);
      osc.start(start);
      osc.stop(start + 0.25);
    }
  },
};

/** Débloque le contexte audio — à appeler depuis un geste utilisateur. */
export function unlockAudio(): void {
  try {
    void getContext().resume();
  } catch {
    /* pas d'audio disponible : on continue sans son */
  }
}

export function playSound(name: SoundName, volume: number): void {
  try {
    if (name === 'custom') {
      if (!customBuffer) {
        RECIPES.bell(volume);
        return;
      }
      const ctx = getContext();
      const source = ctx.createBufferSource();
      source.buffer = customBuffer;
      source.connect(getMaster(volume));
      source.start();
      return;
    }
    RECIPES[name](volume);
  } catch {
    /* un son raté ne doit jamais interrompre le minuteur */
  }
}

export function setVolume(volume: number): void {
  if (masterGain) masterGain.gain.value = volume;
}

export async function loadCustomSound(file: File): Promise<void> {
  const data = await file.arrayBuffer();
  customBuffer = await getContext().decodeAudioData(data);
}

export function hasCustomSound(): boolean {
  return customBuffer !== null;
}
