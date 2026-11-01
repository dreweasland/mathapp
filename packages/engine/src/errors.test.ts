import { describe, expect, it } from 'vitest';
import { classifyError, topError } from './errors';
import { arithCandidates } from './distractors';
import { numericChoices } from './problem';
import { mulberry32 } from './rng';
import type { Operands, Problem } from './types';

const problem = (operands: Operands, answer: string, extra: Partial<Problem> = {}): Problem => ({
  skillId: 's',
  questionType: 'number-pad',
  difficulty: 1,
  operands,
  answer,
  speech: { key: 'k' },
  hint: { visual: 'bars' },
  ...extra,
});
const add = (a: number, b: number) => problem({ kind: 'arith', op: 'add', a, b }, String(a + b));
const sub = (a: number, b: number) => problem({ kind: 'arith', op: 'sub', a, b }, String(a - b));

describe('classifyError', () => {
  it.each([
    ['off by one high', add(3, 4), '8', 'off-by-one'],
    ['off by one low', add(3, 4), '6', 'off-by-one'],
    ['added instead of subtracted', sub(9, 3), '12', 'reversed-operation'],
    ['subtracted instead of added', add(9, 3), '6', 'reversed-operation'],
    ['did not carry', add(27, 15), '32', 'didnt-regroup'],
    ['subtracted smaller digit from bigger', sub(42, 17), '35', 'didnt-regroup'],
    ['reversed digits', add(20, 17), '73', 'digit-swap'],
    ['tens slip', add(23, 12), '45', 'place-value'],
    ['unexplained', add(3, 4), '19', 'other'],
    ['not a number', add(3, 4), 'left', 'other'],
  ] as const)('%s', (_, p, given, expected) => {
    expect(classifyError(p, given)).toBe(expected);
  });

  it('uses the tag on a tapped choice first', () => {
    const p = problem({ kind: 'shape-name', shape: 'circle' }, 'circle', {
      choices: [{ value: 'circle' }, { value: 'square', errorType: 'other' }],
    });
    expect(classifyError(p, 'square')).toBe('other');
  });
  it('classifies unknown addend through the matching subtraction', () => {
    const p = problem({ kind: 'missing-addend', whole: 13, known: 5 }, '8');
    expect(classifyError(p, '18')).toBe('reversed-operation');
    expect(classifyError(p, '9')).toBe('off-by-one');
    expect(classifyError(p, '2')).toBe('other');
  });
  it('sees an off-by-one on non-arithmetic numbers', () => {
    const p = problem({ kind: 'sequence', from: 5, step: 1 }, '6');
    expect(classifyError(p, '7')).toBe('off-by-one');
    expect(classifyError(p, '9')).toBe('other');
  });
  it('a reversal is never also an off-by-one', () => {
    for (let a = 0; a <= 20; a++) {
      for (let b = 1; b <= 20; b++) {
        const types = arithCandidates('add', a, b).filter((c) => c.value === Math.abs(a - b));
        expect(types.map((t) => t.errorType)).not.toContain('off-by-one');
      }
    }
  });
});

describe('arithCandidates', () => {
  it('never includes the answer or a negative', () => {
    for (let a = 0; a <= 30; a++) {
      for (let b = 0; b <= a; b++) {
        for (const c of arithCandidates('sub', a, b)) {
          expect(c.value).not.toBe(a - b);
          expect(c.value).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
  it('flags regrouping only when it applies', () => {
    expect(arithCandidates('add', 12, 13).map((c) => c.errorType)).not.toContain('didnt-regroup');
    expect(arithCandidates('sub', 48, 13).map((c) => c.errorType)).not.toContain('didnt-regroup');
  });
});

describe('numericChoices', () => {
  it('fills up to the count even with no candidates', () => {
    const choices = numericChoices(mulberry32(1), 0, [], { max: 10 });
    expect(choices).toHaveLength(4);
    expect(choices.map((c) => c.value)).toContain('0');
  });
  it('stops rather than loops when the range is too small', () => {
    expect(numericChoices(mulberry32(1), 1, [], { min: 0, max: 1 })).toHaveLength(2);
  });
  it('ignores out-of-range and duplicate candidates', () => {
    const choices = numericChoices(
      mulberry32(1),
      5,
      [
        { value: 5, errorType: 'other' },
        { value: 99, errorType: 'other' },
        { value: 4, errorType: 'off-by-one' },
        { value: 4, errorType: 'other' },
      ],
      { max: 10 },
    );
    const values = choices.map((c) => c.value);
    expect(new Set(values).size).toBe(4);
    expect(values).not.toContain('99');
  });
});

describe('topError', () => {
  it('returns the most common specific error', () => {
    expect(topError({ errorCounts: { 'off-by-one': 2, 'place-value': 5 } })).toBe('place-value');
  });
  it('skips "other", which tells a parent nothing', () => {
    expect(topError({ errorCounts: { other: 9, 'off-by-one': 1 } })).toBe('off-by-one');
    expect(topError({ errorCounts: { other: 9 } })).toBeUndefined();
  });
  it('is empty with no errors', () => {
    expect(topError({ errorCounts: {} })).toBeUndefined();
  });
});
