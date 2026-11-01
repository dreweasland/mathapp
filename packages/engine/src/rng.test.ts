import { describe, expect, it } from 'vitest';
import { hashSeed, mulberry32 } from './rng';

describe('mulberry32', () => {
  it('reproduces a sequence from the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });

  it('gives different sequences for different seeds', () => {
    expect(mulberry32(1).next()).not.toBe(mulberry32(2).next());
  });

  it('matches known output so the algorithm cannot drift unnoticed', () => {
    const r = mulberry32(0);
    expect(r.next()).toBeCloseTo(0.26642920868471265, 12);
    expect(r.next()).toBeCloseTo(0.0003297457005828619, 12);
  });

  it('stays in [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 10000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int() covers both bounds and nothing outside', () => {
    const r = mulberry32(9);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(r.int(3, 7));
    expect([...seen].sort()).toEqual([3, 4, 5, 6, 7]);
  });

  it('int() returns the bound when min equals max', () => {
    expect(mulberry32(1).int(5, 5)).toBe(5);
  });

  it('pick() throws on an empty list', () => {
    expect(() => mulberry32(1).pick([])).toThrow();
  });

  it('pick() only returns list items', () => {
    const r = mulberry32(3);
    for (let i = 0; i < 100; i++) expect(['a', 'b']).toContain(r.pick(['a', 'b']));
  });

  it('shuffle() keeps every item and does not change the input', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const out = mulberry32(5).shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...out].sort()).toEqual(input);
  });

  it('fork() is deterministic and does not repeat the parent', () => {
    const a = mulberry32(11).fork('warmup');
    const b = mulberry32(11).fork('warmup');
    const c = mulberry32(11).fork('skill');
    const av = a.next();
    expect(av).toBe(b.next());
    expect(av).not.toBe(c.next());
  });
});

describe('hashSeed', () => {
  it('is stable and sensitive to input', () => {
    expect(hashSeed('child-1|2026-11-01')).toBe(hashSeed('child-1|2026-11-01'));
    expect(hashSeed('child-1|2026-11-01')).not.toBe(hashSeed('child-1|2026-11-02'));
  });
});
