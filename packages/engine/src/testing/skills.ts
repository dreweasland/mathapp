import type { SkillDef } from '../types';

/** A small graph for logic tests. Real skill data lives in `packages/content`. */
export const def = (id: string, order: number, prerequisites: string[] = []): SkillDef => ({
  id,
  grade: 1,
  standard: 'x',
  name: id,
  kidName: id,
  speechKey: id,
  badgeName: id,
  prerequisites,
  questionTypes: ['number-pad', 'multiple-choice'],
  fastMs: 3000,
  factBased: false,
  mastery: { threshold: 80, minAttempts: 15 },
  order,
});

export const SKILLS: SkillDef[] = [
  def('a', 1),
  def('b', 2, ['a']),
  def('c', 3, ['b']),
  def('d', 4, ['a']),
  def('e', 5),
];
