import { describe, expect, it } from 'vitest';
import { GENERATORS } from './generators';
import { mulberry32 } from './rng';
import { assertValid, DIFFICULTIES } from './testing/harness';
import { solve } from './testing/solver';

/**
 * Answer-key audit. A wrong answer key is the highest-severity bug in this project.
 * Every answer is recomputed by `testing/solver.ts`, which shares no code with generators.
 */
const PER_DIFFICULTY = 500;

describe('answer-key audit', () => {
  it.each(Object.keys(GENERATORS))('%s: 2,500 problems all check out', (skillId) => {
    const generate = GENERATORS[skillId];
    if (!generate) throw new Error(skillId);
    let checked = 0;
    for (const d of DIFFICULTIES) {
      for (let seed = 0; seed < PER_DIFFICULTY; seed++) {
        const p = generate(mulberry32(seed * 104729 + d), d);
        assertValid(p, skillId, [
          'multiple-choice',
          'number-pad',
          'ten-frame',
          'number-line',
          'compare',
          'clock-face',
        ]);
        if (p.operands.kind !== 'family' || p.operands.ask !== 'belongs') {
          expect(p.answer).toBe(solve(p));
        }
        checked++;
      }
    }
    expect(checked).toBe(2500);
  });

  it('covers all 14 Grade 1 skills', () => {
    expect(Object.keys(GENERATORS)).toHaveLength(14);
  });
});
