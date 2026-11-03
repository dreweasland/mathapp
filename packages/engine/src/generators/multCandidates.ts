import type { Candidate } from '../distractors';

/** Wrong products a child is likely to give, each tagged with its cause. */
export const multCandidates = (a: number, b: number): Candidate[] => [
  { value: a + b, errorType: 'reversed-operation' },
  { value: a * b + a, errorType: 'other' },
  { value: a * b - a, errorType: 'other' },
  { value: a * b + 1, errorType: 'off-by-one' },
];
