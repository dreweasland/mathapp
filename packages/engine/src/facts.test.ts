import { describe, expect, it } from 'vitest';
import {
  addFactId,
  allFacts,
  divFactId,
  factSkill,
  isSubFact,
  mulFactId,
  parseFactId,
  subFactId,
} from './facts';

describe('facts', () => {
  it('has 121 addition and 121 subtraction cards', () => {
    const facts = allFacts();
    expect(facts.filter((f) => f.op === 'add')).toHaveLength(121);
    expect(facts.filter((f) => f.op === 'sub')).toHaveLength(121);
  });
  it('has 100 multiplication and 100 division cards', () => {
    const facts = allFacts();
    expect(facts.filter((f) => f.op === 'mul')).toHaveLength(100);
    expect(facts.filter((f) => f.op === 'div')).toHaveLength(100);
  });
  it('each division fact is the inverse of a multiplication fact', () => {
    for (const f of allFacts().filter((x) => x.op === 'div')) {
      expect(f.a % f.b).toBe(0);
      expect(mulFactId(f.b, f.a / f.b)).toBeDefined();
    }
  });
  it('round-trips every id', () => {
    for (const f of allFacts()) expect(parseFactId(f.id)).toEqual(f);
  });
  it('puts products and quotients in Grade 3', () => {
    expect(factSkill(parseFactId('mul:3x4'))).toBe('3.mult-facts');
    expect(factSkill(parseFactId('div:12/3'))).toBe('3.div-facts');
  });
  it('rejects division that does not come out even, and factors past 10', () => {
    expect(divFactId(13, 4)).toBeUndefined();
    expect(mulFactId(11, 2)).toBeUndefined();
    expect(divFactId(121, 11)).toBeUndefined();
  });
  it('ids are unique', () => {
    const ids = allFacts().map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('each subtraction fact is the inverse of an addition fact', () => {
    for (const f of allFacts().filter((x) => x.op === 'sub')) {
      expect(addFactId(f.b, f.a - f.b)).toBeDefined();
    }
  });
  it('splits skills at 10: 66 within 10, 55 within 20, for each operation', () => {
    const count = (skill: string) => allFacts().filter((f) => factSkill(f) === skill).length;
    expect(count('1.add-within-10')).toBe(66);
    expect(count('1.add-within-20')).toBe(55);
    expect(count('1.sub-within-10')).toBe(66);
    expect(count('1.sub-within-20')).toBe(55);
  });
  it('rejects non-facts', () => {
    expect(addFactId(13, 4)).toBeUndefined();
    expect(subFactId(20, 3)).toBeUndefined();
    expect(subFactId(3, 5)).toBeUndefined();
    expect(isSubFact(13, 5)).toBe(true);
  });
  it('round-trips ids', () => {
    expect(parseFactId('sub:13-5')).toEqual({ id: 'sub:13-5', op: 'sub', a: 13, b: 5 });
    expect(() => parseFactId('nope')).toThrow();
  });
});
