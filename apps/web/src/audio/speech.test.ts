// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSpeaker } from './speech';

class Utterance {
  lang = '';
  rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

function fakeSynth() {
  const spoken: Utterance[] = [];
  return {
    spoken,
    synth: {
      speak: (u: Utterance) => spoken.push(u),
      cancel: vi.fn(),
    } as unknown as SpeechSynthesis,
  };
}

describe('speaker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders the line from its key', () => {
    const { synth, spoken } = fakeSynth();
    createSpeaker(synth).say({ key: 'q.add', params: { a: 3, b: 4 } });
    expect(spoken[0]?.text).toBe('What is 3 plus 4?');
  });
  it('calls back when speech ends', () => {
    const { synth, spoken } = fakeSynth();
    const done = vi.fn();
    createSpeaker(synth).say({ key: 'home.start' }, done);
    spoken[0]?.onend?.();
    expect(done).toHaveBeenCalledOnce();
  });
  it('still calls back if iOS never fires the end event', () => {
    const { synth } = fakeSynth();
    const done = vi.fn();
    createSpeaker(synth).say({ key: 'home.start' }, done);
    vi.advanceTimersByTime(30_000);
    expect(done).toHaveBeenCalledOnce();
  });
  it('calls back once even if both the event and the timer fire', () => {
    const { synth, spoken } = fakeSynth();
    const done = vi.fn();
    createSpeaker(synth).say({ key: 'home.start' }, done);
    spoken[0]?.onend?.();
    vi.advanceTimersByTime(30_000);
    expect(done).toHaveBeenCalledOnce();
  });
  it('a newer line silences the older callback', () => {
    const { synth, spoken } = fakeSynth();
    const first = vi.fn();
    const speaker = createSpeaker(synth);
    speaker.say({ key: 'home.start' }, first);
    speaker.say({ key: 'home.done' });
    spoken[0]?.onend?.();
    vi.advanceTimersByTime(30_000);
    expect(first).not.toHaveBeenCalled();
  });
  it('works with no speech at all, and says so', () => {
    const speaker = createSpeaker(undefined);
    const done = vi.fn();
    speaker.say({ key: 'home.start' }, done);
    expect(speaker.available).toBe(false);
    expect(done).toHaveBeenCalledOnce();
  });
});

describe('choosing a voice', () => {
  it('uses the chosen voice, and the default when it has gone', () => {
    const spoken: { voice?: unknown }[] = [];
    const voice = { name: 'Samantha' };
    const synth = {
      cancel: () => undefined,
      speak: (u: { voice?: unknown }) => spoken.push(u),
      getVoices: () => [voice],
    } as unknown as SpeechSynthesis;
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
    const speaker = createSpeaker(synth);
    speaker.setVoice('Samantha');
    speaker.say({ key: 'digit', params: { digit: '1' } });
    expect(spoken[0]?.voice).toBe(voice);
    speaker.setVoice('Gone');
    speaker.say({ key: 'digit', params: { digit: '2' } });
    expect(spoken[1]?.voice).toBeUndefined();
    speaker.setVoice(undefined);
    speaker.say({ key: 'digit', params: { digit: '3' } });
    expect(spoken[2]?.voice).toBeUndefined();
  });
});
