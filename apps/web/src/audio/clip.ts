import type { CheerAudio } from '../db/db';

export interface ClipPlayer {
  /** Call from inside a tap: iOS blocks audio that starts later. */
  play(audio: CheerAudio, onDone?: () => void): void;
  stop(): void;
}

/** Plays a grown-up's recording. Failing is fine: the cheer's picture still shows. */
export function createClipPlayer(): ClipPlayer {
  let release: (() => void) | undefined;
  const player: ClipPlayer = {
    play(audio, onDone) {
      player.stop();
      const url = URL.createObjectURL(new Blob([audio.bytes], { type: audio.type }));
      const element = new Audio(url);
      const finish = () => {
        element.pause();
        URL.revokeObjectURL(url);
        if (release === finish) release = undefined;
      };
      release = finish;
      const done = () => {
        finish();
        onDone?.();
      };
      element.onended = done;
      element.onerror = done;
      element.play().catch(done);
    },
    stop() {
      release?.();
    },
  };
  return player;
}
