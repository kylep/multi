/** Web Audio sound effects — procedural tones, no audio files. */

const SOUND_KEY = "robot-battle-sound";

export interface SoundPlayer {
  hit(): void;
  miss(): void;
  victory(): void;
  defeat(): void;
  levelUp(): void;
  buy(): void;
  click(): void;
  setEnabled(on: boolean): void;
  isEnabled(): boolean;
}

export function createSoundPlayer(): SoundPlayer {
  let ctx: AudioContext | null = null;
  let enabled = localStorage.getItem(SOUND_KEY) !== "false"; // default on

  function getCtx(): AudioContext {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq: number, duration: number, type: OscillatorType = "square", gain = 0.08): void {
    if (!enabled) return;
    const c = getCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    g.gain.linearRampToValueAtTime(0, c.currentTime + duration);
    osc.connect(g).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration);
  }

  function noise(duration: number, gain = 0.06): void {
    if (!enabled) return;
    const c = getCtx();
    const bufferSize = Math.floor(c.sampleRate * duration);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    const g = c.createGain();
    src.buffer = buffer;
    g.gain.value = gain;
    g.gain.linearRampToValueAtTime(0, c.currentTime + duration);
    src.connect(g).connect(c.destination);
    src.start();
  }

  return {
    hit() { noise(0.05, 0.08); },

    miss() {
      tone(400, 0.1, "sine", 0.05);
      setTimeout(() => tone(200, 0.08, "sine", 0.04), 40);
    },

    victory() {
      tone(523, 0.12, "square", 0.06); // C5
      setTimeout(() => tone(659, 0.12, "square", 0.06), 100); // E5
      setTimeout(() => tone(784, 0.2, "square", 0.06), 200); // G5
    },

    defeat() {
      tone(392, 0.15, "sawtooth", 0.05); // G4
      setTimeout(() => tone(262, 0.25, "sawtooth", 0.05), 150); // C4
    },

    levelUp() {
      tone(523, 0.1, "square", 0.06); // C5
      setTimeout(() => tone(659, 0.1, "square", 0.06), 80); // E5
      setTimeout(() => tone(784, 0.1, "square", 0.06), 160); // G5
      setTimeout(() => tone(1047, 0.15, "square", 0.06), 240); // C6
    },

    buy() {
      tone(1200, 0.06, "square", 0.04);
      setTimeout(() => tone(1600, 0.08, "square", 0.04), 60);
    },

    click() {
      tone(800, 0.03, "square", 0.03);
    },

    setEnabled(on: boolean) {
      enabled = on;
      localStorage.setItem(SOUND_KEY, String(on));
    },

    isEnabled() { return enabled; },
  };
}
