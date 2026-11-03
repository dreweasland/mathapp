import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { rounding as gen } from './rounding';

describeGenerator('3.round', gen, ['number-pad', 'multiple-choice'] as const);
const all = sampleAll(gen);
type R = { n: number; to: number };

describe('3.round', () => {
  it('answers are multiples of the rounding place', () => {
    for (const p of all) expect(Number(p.answer) % (p.operands as R).to).toBe(0);
  });
  it('the answer is the nearest multiple', () => {
    for (const p of all) {
      const o = p.operands as R;
      expect(Math.abs(Number(p.answer) - o.n)).toBeLessThanOrEqual(o.to / 2);
    }
  });
  it('a 5 rounds up', () => {
    for (const p of all) {
      const o = p.operands as R;
      if (o.n % o.to === o.to / 2) expect(Number(p.answer)).toBeGreaterThan(o.n);
    }
  });
  it('tests the exact halfway case often', () => {
    const halfway = all.filter((p) => {
      const o = p.operands as R;
      return o.n % o.to === o.to / 2;
    });
    expect(halfway.length).toBeGreaterThan(all.length / 8);
  });
  it('levels 1 and 2 round to 10', () => {
    for (const p of [...sample(gen, 1), ...sample(gen, 2)]) expect((p.operands as R).to).toBe(10);
  });
  it('level 3 rounds to 100', () => {
    for (const p of sample(gen, 3)) expect((p.operands as R).to).toBe(100);
  });
  it('can round up across 1000', () => {
    const hit = sample(gen, 5, 5000).some((p) => p.answer === '1000');
    expect(hit).toBe(true);
  });
  it('wrong choices include rounding the other way', () => {
    for (const p of sample(gen, 4, 60)) {
      if (p.questionType !== 'multiple-choice') continue;
      const o = p.operands as R;
      const other = Number(p.answer) > o.n ? Number(p.answer) - o.to : Number(p.answer) + o.to;
      expect(p.choices?.map((c) => c.value)).toContain(String(other));
    }
  });
});
