import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { evenOdd as gen } from './evenOdd';

describeGenerator('2.even-odd', gen, ['number-pad', 'multiple-choice'] as const);
const all = sampleAll(gen);

describe('2.even-odd', () => {
  it('answers even for 2s and odd for the rest', () => {
    for (const p of all) {
      if (p.operands.kind === 'even-odd') {
        expect(p.answer).toBe(p.operands.n % 2 === 0 ? 'even' : 'odd');
      }
    }
  });
  it('has exactly two choices', () => {
    for (const p of all)
      if (p.questionType === 'multiple-choice') expect(p.choices).toHaveLength(2);
  });
  it('next-number keeps the same parity', () => {
    for (const p of all) {
      if (p.operands.kind === 'skip') expect((Number(p.answer) - p.operands.from) % 2).toBe(0);
    }
  });
  it('says even or odd correctly in the next-number prompt', () => {
    for (const p of all) {
      if (p.operands.kind !== 'skip') continue;
      expect(p.speech.key).toBe(p.operands.from % 2 === 0 ? 'q.next-even' : 'q.next-odd');
    }
  });
  it('level 1 stays within 10', () => {
    for (const p of sample(gen, 1)) {
      const o = p.operands as { n?: number; from?: number };
      expect(o.n ?? o.from).toBeLessThanOrEqual(10);
    }
  });
  it('level 5 uses three-digit numbers', () => {
    expect(
      sample(gen, 5).some(
        (p) => Number(p.answer) >= 100 || (p.operands as { n?: number }).n! >= 100,
      ),
    ).toBe(true);
  });
  it('hint never draws more than 30 dots', () => {
    for (const p of all) expect(p.hint.params?.['n']).toBeLessThanOrEqual(30);
  });
  it('hint dots keep the parity of the number', () => {
    const o = sample(gen, 1, 200).filter((p) => p.operands.kind === 'even-odd');
    for (const p of o) expect(p.hint.params?.['n']).toBe((p.operands as { n: number }).n);
  });
});
