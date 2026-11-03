/**
 * Fact cards: addends 0–10 (CCSS 2.OA.B.2) and their subtraction inverses, then factors 1–10
 * and their division inverses. `3+4` and `4+3` are separate cards.
 * Id formats: `add:3+4`, `sub:7-4`, `mul:3x4`, `div:12/3`.
 */
export type FactOp = 'add' | 'sub' | 'mul' | 'div';

export interface Fact {
  id: string;
  op: FactOp;
  a: number;
  b: number;
}

export const isAddFact = (a: number, b: number): boolean => a >= 0 && a <= 10 && b >= 0 && b <= 10;
export const isSubFact = (a: number, b: number): boolean => a - b >= 0 && isAddFact(b, a - b);

export const addFactId = (a: number, b: number): string | undefined =>
  isAddFact(a, b) ? `add:${a}+${b}` : undefined;
export const subFactId = (a: number, b: number): string | undefined =>
  isSubFact(a, b) ? `sub:${a}-${b}` : undefined;

export const isMulFact = (a: number, b: number): boolean => a >= 1 && a <= 10 && b >= 1 && b <= 10;
export const isDivFact = (a: number, b: number): boolean =>
  b >= 1 && a % b === 0 && isMulFact(b, a / b);

export const mulFactId = (a: number, b: number): string | undefined =>
  isMulFact(a, b) ? `mul:${a}x${b}` : undefined;
export const divFactId = (a: number, b: number): string | undefined =>
  isDivFact(a, b) ? `div:${a}/${b}` : undefined;

/** The brief's teaching order for multiplication. */
export const FACTOR_ORDER = [2, 5, 10, 3, 4, 6, 7, 8, 9] as const;

export function parseFactId(id: string): Fact {
  const m = /^(add|sub|mul|div):(\d+)[-+x/](\d+)$/.exec(id);
  if (!m) throw new Error(`Not a fact id: ${id}`);
  return { id, op: m[1] as FactOp, a: Number(m[2]), b: Number(m[3]) };
}

export function allFacts(): Fact[] {
  const facts: Fact[] = [];
  for (let a = 0; a <= 10; a++) {
    for (let b = 0; b <= 10; b++) {
      facts.push({ id: `add:${a}+${b}`, op: 'add', a, b });
      facts.push({ id: `sub:${a + b}-${a}`, op: 'sub', a: a + b, b: a });
    }
  }
  for (let a = 1; a <= 10; a++) {
    for (let b = 1; b <= 10; b++) {
      facts.push({ id: `mul:${a}x${b}`, op: 'mul', a, b });
      facts.push({ id: `div:${a * b}/${a}`, op: 'div', a: a * b, b: a });
    }
  }
  return facts;
}

/** Which skill first introduces a fact. */
export function factSkill(fact: Fact): string {
  if (fact.op === 'mul') return '3.mult-facts';
  if (fact.op === 'div') return '3.div-facts';
  if (fact.op === 'add') return fact.a + fact.b <= 10 ? '1.add-within-10' : '1.add-within-20';
  return fact.a <= 10 ? '1.sub-within-10' : '1.sub-within-20';
}
