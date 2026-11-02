import { render } from '@mathapp/content';
import type { Speech } from '@mathapp/engine';

export interface Speaker {
  /** False when the device can't speak, so the UI must show what it would have said. */
  readonly available: boolean;
  /** Must first run inside a tap: iOS stays silent until then. */
  unlock(): void;
  /** Replaces anything already being said. `onDone` always fires, even if speech fails. */
  say(line: Speech, onDone?: () => void): void;
  stop(): void;
}

/** iOS sometimes never fires `onend`, so a timer guards everything that waits on speech. */
const watchdogMs = (text: string) => 1500 + text.length * 90;

/**
 * Speaks through the Web Speech API. Every line is addressed by its string key, so recorded
 * clips can replace the synthetic voice later without touching the callers.
 */
export function createSpeaker(synth = window.speechSynthesis as SpeechSynthesis | undefined) {
  let token = 0;
  let unlocked = false;
  const speaker: Speaker = {
    available: synth !== undefined && 'SpeechSynthesisUtterance' in window,
    unlock() {
      if (!synth || unlocked || !speaker.available) return;
      unlocked = true;
      synth.speak(new SpeechSynthesisUtterance(''));
    },
    say(line, onDone) {
      const mine = ++token;
      let finished = false;
      const finish = () => {
        if (finished || mine !== token) return;
        finished = true;
        onDone?.();
      };
      const text = render(line.key, line.params);
      if (!synth || !speaker.available) {
        finish();
        return;
      }
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = finish;
      utterance.onerror = finish;
      synth.speak(utterance);
      setTimeout(finish, watchdogMs(text));
    },
    stop() {
      token++;
      synth?.cancel();
    },
  };
  return speaker;
}
