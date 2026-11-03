import type { Problem } from '../types';

/**
 * Independent answer key, used only by tests. It shares no code with the generators and
 * works from `operands` alone, so a generator bug can't pass by agreeing with itself.
 */
const SIDES: Record<string, number> = {
  triangle: 3,
  square: 4,
  rectangle: 4,
  rhombus: 4,
  trapezoid: 4,
  hexagon: 6,
};

export function solve(problem: Problem): string {
  const o = problem.operands;
  switch (o.kind) {
    case 'arith':
      return String(o.op === 'add' ? o.a + o.b : o.a - o.b);
    case 'missing-addend':
      return String(o.whole - o.known);
    case 'sequence':
      return String(o.from + o.step);
    case 'count':
    case 'numeral':
      return String(o.value);
    case 'compare':
      if (o.form === 'tap') return o.a > o.b ? 'left' : o.a < o.b ? 'right' : 'same';
      return o.a > o.b ? '>' : o.a < o.b ? '<' : '=';
    case 'place-value':
      if (o.ask === 'tens') return String(o.tens);
      if (o.ask === 'ones') return String(o.ones);
      return String(10 * o.tens + o.ones);
    case 'family':
      if (o.ask === 'flip') return String(o.b + o.a);
      if (o.ask === 'sub-a') return String(o.a + o.b - o.a);
      if (o.ask === 'sub-b') return String(o.a + o.b - o.b);
      return `${o.a + o.b}-${o.a}=${o.b}`;
    case 'clock':
      return `${o.hour}:${o.minute === 0 ? '00' : o.minute}`;
    case 'shape-name':
      return o.shape;
    case 'shape-sides': {
      const sides = SIDES[o.shape];
      if (sides === undefined) throw new Error(`no side count for ${o.shape}`);
      return String(sides);
    }
    case 'shares':
      return `${o.shape}:${o.parts}:equal`;
    case 'lengths': {
      const sorted = [...o.lengths].sort((x, y) => x - y);
      const target =
        o.ask === 'longest'
          ? sorted[sorted.length - 1]
          : o.ask === 'shortest'
            ? sorted[0]
            : sorted[1];
      const index = o.lengths.indexOf(target as number);
      if (o.lengths.length === 2) return index === 0 ? 'left' : 'right';
      return String(index);
    }
  }
}

/** True if `text` like "7-3=4" or "3+4=7" is a true equation. */
export function isTrueEquation(text: string): boolean {
  const m = /^(\d+)([+-])(\d+)=(\d+)$/.exec(text);
  if (!m) return false;
  const [a, b, c] = [Number(m[1]), Number(m[3]), Number(m[4])];
  return (m[2] === '+' ? a + b : a - b) === c;
}
