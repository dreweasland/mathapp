import type { Problem, StepOp } from '../types';

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

function step(x: number, op: StepOp, y: number): number {
  if (op === 'add') return x + y;
  if (op === 'sub') return x - y;
  return op === 'mul' ? x * y : x / y;
}

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
      return `${o.hour}:${String(o.minute).padStart(2, '0')}`;
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
    case 'place-value-3': {
      if (o.ask === 'value') return String(100 * o.hundreds + 10 * o.tens + o.ones);
      return String(o[o.ask]);
    }
    case 'skip':
      return String(o.from + o.step);
    case 'even-odd':
      return o.n % 2 === 0 ? 'even' : 'odd';
    case 'array':
      return String(o.rows * o.cols);
    case 'money': {
      const cents = o.items.reduce((sum, item) => sum + item, 0);
      return String(o.unit === 'dollars' ? cents / 100 : cents);
    }
    case 'make-amount': {
      const right = (problem.choices ?? []).filter(
        (c) => c.value.split('+').reduce((sum, coin) => sum + Number(coin), 0) === o.target,
      );
      if (right.length !== 1) throw new Error(`${right.length} choices make ${o.target}`);
      return (right[0] as { value: string }).value;
    }
    case 'change':
      return String(o.paid - o.cost);
    case 'am-pm':
      return o.part;
    case 'two-step':
      return String(step(step(o.a, o.first, o.b), o.second, o.c));
    case 'ruler':
      return String(o.length);
    case 'estimate':
      return String(o.actual);
    case 'mult':
      return String(o.a * o.b);
    case 'div':
      return String(o.a / o.b);
    case 'share':
      return String(o.total / o.parts);
    case 'unknown-factor':
      return String(o.product / o.known);
    case 'family-md':
      if (o.ask === 'flip') return String(o.b * o.a);
      return String((o.a * o.b) / (o.ask === 'div-a' ? o.a : o.b));
    case 'round': {
      const remainder = o.n % o.to;
      return String(o.n - remainder + (remainder * 2 >= o.to ? o.to : 0));
    }
    case 'fraction':
      return o.ask === 'parts' ? String(o.d) : `${o.n}/${o.d}`;
    case 'fraction-compare': {
      const left = o.an * o.bd;
      const right = o.bn * o.ad;
      if (o.form === 'tap') return left > right ? 'left' : left < right ? 'right' : 'same';
      return left > right ? '>' : left < right ? '<' : '=';
    }
    case 'fraction-equal':
      return String(o.n * o.scale);
    case 'elapsed': {
      if (o.ask === 'minutes') return String(o.passed);
      const total = o.hour * 60 + o.minute + o.passed;
      const hour = ((Math.floor(total / 60) + 11) % 12) + 1;
      return `${hour}:${String(total % 60).padStart(2, '0')}`;
    }
    case 'area':
      return String(o.ask === 'area' ? o.w * o.h : 2 * (o.w + o.h));
  }
}

/** True if `text` like "7-3=4" or "3+4=7" is a true equation. */
export function isTrueEquation(text: string): boolean {
  const m = /^(\d+)([+-])(\d+)=(\d+)$/.exec(text);
  if (!m) return false;
  const [a, b, c] = [Number(m[1]), Number(m[3]), Number(m[4])];
  return (m[2] === '+' ? a + b : a - b) === c;
}
