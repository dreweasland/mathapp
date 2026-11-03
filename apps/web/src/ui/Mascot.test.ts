import { describe, expect, it } from 'vitest';
import type { Mood } from '../game/store';
import { mouthFor } from './Mascot';

describe('the mascot', () => {
  it('never frowns, whatever the mood: a mouth always curves down in the middle', () => {
    for (const mood of ['idle', 'happy', 'cheer', 'thinking'] as Mood[]) {
      const [, startY, controlY, endY] =
        /M\d+ (\d+) Q\d+ (\d+) \d+ (\d+)/.exec(mouthFor(mood)) ?? [];
      expect(Number(controlY), mood).toBeGreaterThan(Math.max(Number(startY), Number(endY)));
    }
  });
});
