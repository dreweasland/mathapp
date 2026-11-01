import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import type { Problem, ShapeName } from '../types';
import { shapes } from './shapes';

describeGenerator('1.shapes', shapes, ['multiple-choice', 'number-pad']);

const kind = (p: Problem) => p.operands.kind;
const asked = (name: ShapeName) =>
  sampleAll(shapes, 1500).filter(
    (p) => p.operands.kind === 'shape-name' && p.operands.shape === name,
  );

describe('1.shapes', () => {
  it('a circle never gets a sides question', () => {
    for (const p of sampleAll(shapes)) {
      if (p.operands.kind === 'shape-sides') expect(p.operands.shape).not.toBe('circle');
    }
  });
  it.each([
    ['triangle', '3'],
    ['square', '4'],
    ['hexagon', '6'],
  ] as const)('a %s has %s sides', (shape, sides) => {
    const p = sampleAll(shapes, 1000).find(
      (x) => x.operands.kind === 'shape-sides' && x.operands.shape === shape,
    );
    expect(p?.answer).toBe(sides);
  });
  it('"rectangle" never lists a square as a wrong option, since a square is one', () => {
    const ps = asked('rectangle');
    expect(ps.length).toBeGreaterThan(0);
    for (const p of ps) expect(p.choices?.map((c) => c.value)).not.toContain('square');
  });
  it('"rhombus" never lists a square as a wrong option', () => {
    const ps = asked('rhombus');
    expect(ps.length).toBeGreaterThan(0);
    for (const p of ps) expect(p.choices?.map((c) => c.value)).not.toContain('square');
  });
  it('"trapezoid" never lists a parallelogram-family shape as a wrong option', () => {
    const ps = asked('trapezoid');
    expect(ps.length).toBeGreaterThan(0);
    for (const p of ps) {
      const values = p.choices?.map((c) => c.value);
      for (const s of ['square', 'rectangle', 'rhombus']) expect(values).not.toContain(s);
    }
  });
  it('every name question has at least 3 options', () => {
    for (const p of sampleAll(shapes)) {
      if (kind(p) === 'shape-name') expect(p.choices?.length).toBeGreaterThanOrEqual(3);
    }
  });
  it('difficulty 1 uses only circle, square, triangle', () => {
    for (const p of sample(shapes, 1)) {
      if (p.operands.kind === 'shape-name') {
        expect(['circle', 'square', 'triangle']).toContain(p.operands.shape);
      }
    }
  });
  it('difficulties 1–3 have no equal-shares problems', () => {
    for (const d of [1, 2, 3] as const) {
      for (const p of sample(shapes, d)) expect(kind(p)).not.toBe('shares');
    }
  });
  it('difficulty 4 introduces halves only', () => {
    const ps = sample(shapes, 4).filter((p) => p.operands.kind === 'shares');
    expect(ps.length).toBeGreaterThan(0);
    for (const p of ps) expect(p.answer).toContain(':2:');
  });
  it('difficulty 5 includes quarters', () => {
    expect(sample(shapes, 5).some((p) => p.answer.includes(':4:equal'))).toBe(true);
  });
  it('share answers are always the equal option with the right number of parts', () => {
    for (const p of sampleAll(shapes)) {
      if (p.operands.kind !== 'shares') continue;
      const { shape, parts } = p.operands;
      expect(p.answer).toBe(`${shape}:${parts}:equal`);
      expect(p.choices?.filter((c) => c.value.endsWith(`:${parts}:equal`))).toHaveLength(1);
    }
  });
});
