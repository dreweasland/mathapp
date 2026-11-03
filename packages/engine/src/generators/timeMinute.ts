import { formatTime, numberProblem, tagged } from '../problem';
import type { Difficulty, Generator, Problem } from '../types';
import { clockChoices, clockProblem } from './time5Min';

const SKILL = '3.time-minute';
const PASSED: Record<Difficulty, number[]> = {
  1: [10, 15, 30],
  2: [5, 10, 15, 20, 30],
  3: [7, 12, 18, 25, 35],
  4: [13, 24, 37, 45, 52],
  5: [17, 28, 43, 55, 65],
};

export const timeMinute: Generator = (rng, difficulty) => {
  const hour = rng.int(1, 12);
  const minute = difficulty <= 2 ? 5 * rng.int(0, 11) : rng.int(0, 59);
  const form = rng.int(1, 3);
  if (form === 1) return clockProblem(rng, SKILL, difficulty, hour, minute, 1);
  const passed = rng.pick(PASSED[difficulty]);
  const total = hour * 60 + minute + passed;
  const endHour = ((Math.floor(total / 60) + 11) % 12) + 1;
  const endMinute = total % 60;
  const hint = {
    visual: 'clock',
    params: { hour: endHour, minute: endMinute, start: formatTime(hour, minute) },
  } as const;
  if (form === 2) {
    return numberProblem(rng, {
      skillId: SKILL,
      difficulty,
      operands: { kind: 'elapsed', hour, minute, passed, ask: 'minutes' },
      answer: passed,
      speech: {
        key: 'q.elapsed-minutes',
        params: { start: formatTime(hour, minute), end: formatTime(endHour, endMinute) },
      },
      hint,
      type: 'number-pad',
    });
  }
  const answer = formatTime(endHour, endMinute);
  const problem: Problem = {
    skillId: SKILL,
    questionType: 'multiple-choice',
    difficulty,
    operands: { kind: 'elapsed', hour, minute, passed, ask: 'end' },
    answer,
    choices: tagged(rng, answer, clockChoices(endHour, endMinute, 5).slice(0, 3)),
    speech: { key: 'q.elapsed-end', params: { start: formatTime(hour, minute), passed } },
    hint,
  };
  return problem;
};
