export type Sound = 'tap' | 'correct' | 'not-yet' | 'cheer';
export type PlaySound = (sound: Sound) => void;

type Note = [frequency: number, startSeconds: number, seconds: number];

/** Soft sine tones. "Not yet" is a gentle two-note rise, never a buzzer. */
const SOUNDS: Record<Sound, { notes: Note[]; volume: number }> = {
  tap: { notes: [[660, 0, 0.05]], volume: 0.06 },
  correct: {
    notes: [
      [660, 0, 0.1],
      [880, 0.08, 0.16],
    ],
    volume: 0.16,
  },
  'not-yet': {
    notes: [
      [392, 0, 0.14],
      [440, 0.12, 0.18],
    ],
    volume: 0.08,
  },
  cheer: {
    notes: [
      [523, 0, 0.14],
      [659, 0.12, 0.14],
      [784, 0.24, 0.14],
      [1047, 0.36, 0.3],
    ],
    volume: 0.18,
  },
};

/** Synthesized, so there are no files to cache and it plays with no delay. */
export function createSfx(): PlaySound {
  let context: AudioContext | undefined;
  return (sound) => {
    if (typeof AudioContext === 'undefined') return;
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
    const { notes, volume } = SOUNDS[sound];
    for (const [frequency, start, seconds] of notes) {
      const at = context.currentTime + start;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + seconds);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(at);
      oscillator.stop(at + seconds);
    }
  };
}
