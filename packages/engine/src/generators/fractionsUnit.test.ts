import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { fractionsUnit as gen } from './fractionsUnit';

describeGenerator('3.fractions-unit', gen, ['number-pad', 'multiple-choice'] as const);
const all = sampleAll(gen);
type F = { n: number; d: number; form: string; ask: string };

describe('3.fractions-unit', () => {
  it('uses the Grade 3 denominators only', () => {
    for (const p of all) expect([2, 3, 4, 6, 8]).toContain((p.operands as F).d);
  });
  it('is always a unit fraction', () => {
    for (const p of all) expect((p.operands as F).n).toBe(1);
  });
  it('names read 1 over d', () => {
    for (const p of all) {
      const o = p.operands as F;
      if (o.ask === 'name') expect(p.answer).toBe(`1/${o.d}`);
    }
  });
  it('parts questions answer the denominator', () => {
    for (const p of all) {
      const o = p.operands as F;
      if (o.ask === 'parts') expect(Number(p.answer)).toBe(o.d);
    }
  });
  it('level 1 is halves and fourths', () => {
    for (const p of sample(gen, 1)) expect([2, 4]).toContain((p.operands as F).d);
  });
  it('number lines start at level 3', () => {
    for (const p of [...sample(gen, 1), ...sample(gen, 2)])
      expect((p.operands as F).form).toBe('shape');
    expect(sample(gen, 3).some((p) => (p.operands as F).form === 'line')).toBe(true);
  });
  it('wrong choices are unit fractions too', () => {
    for (const p of all) for (const c of p.choices ?? []) expect(c.value).toMatch(/^1\/\d$/);
  });
  it('speech matches the form', () => {
    for (const p of all) {
      const line = p.speech.key.includes('line');
      expect(line).toBe((p.operands as F).form === 'line');
    }
  });
});
