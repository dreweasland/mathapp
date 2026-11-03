// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Plant, flowersFor, leavesFor } from './Plant';

afterEach(cleanup);

describe('the streak plant', () => {
  it('grows a leaf a day', () => {
    const { container } = render(<Plant days={5} />);
    expect(container.querySelectorAll('[data-leaf]')).toHaveLength(5);
  });
  it('blooms at each milestone, once it runs out of room for leaves', () => {
    expect([2, 3, 7, 14, 100].map(flowersFor)).toEqual([0, 1, 2, 3, 6]);
    expect(leavesFor(100)).toBe(14);
  });
  it('a new streak is a healthy sprout, in the same green', () => {
    const { container } = render(<Plant days={0} />);
    const greens = [...container.querySelectorAll('ellipse, line')].map(
      (el) => el.getAttribute('fill') ?? el.getAttribute('stroke'),
    );
    expect(greens.length).toBeGreaterThan(1);
    for (const color of greens) expect(['#5cc26c', '#3f9e4d']).toContain(color);
  });
});
