import { GENERATORS, mulberry32, type Difficulty, type Problem } from '@mathapp/engine';
import { describe, expect, it } from 'vitest';
import { lengthObjects } from './Lengths';
import { SCENE_ART, STORY_ART } from './StoryArt';

const LEVELS: Difficulty[] = [1, 2, 3, 4, 5];
const problems: Problem[] = Object.values(GENERATORS).flatMap((generate) =>
  LEVELS.flatMap((d) => Array.from({ length: 40 }, (_, i) => generate(mulberry32(i * 17 + 3), d))),
);

/** Every picture name a problem can ask for, by where it's drawn. */
function picturesIn(problem: Problem): string[] {
  const o = problem.operands;
  const scene = problem.picture?.scene;
  if (o.kind === 'am-pm') return [o.scene];
  if (o.kind === 'estimate') return [o.object];
  if (o.kind === 'lengths' && scene) return lengthObjects(scene);
  if (o.kind === 'two-step' && scene) return [scene];
  if (o.kind === 'arith' && scene) {
    const animals = SCENE_ART[scene];
    return animals ? [animals.first, animals.second] : [`scene ${scene}`];
  }
  return [];
}

describe('word-problem pictures', () => {
  it('draws every picture a problem can ask for', () => {
    const asked = new Set(problems.flatMap(picturesIn));
    expect(asked.size).toBeGreaterThan(20);
    expect([...asked].filter((name) => !(name in STORY_ART))).toEqual([]);
  });
});
