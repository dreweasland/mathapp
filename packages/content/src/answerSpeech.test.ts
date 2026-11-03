import { describe, expect, it } from 'vitest';
import { GENERATORS, mulberry32, type Difficulty, type Problem } from '@mathapp/engine';
import { answerSpeech } from './answerSpeech';
import { render } from './strings.en';

const said = (p: Problem) => {
  const s = answerSpeech(p);
  return render(s.key, s.params);
};
const base = {
  skillId: 'x',
  questionType: 'multiple-choice',
  difficulty: 1,
  speech: { key: 'q.add' },
  hint: { visual: 'bars' },
} as const;

describe('answerSpeech', () => {
  it('can speak the answer to anything a generator makes', () => {
    for (const generate of Object.values(GENERATORS)) {
      for (let seed = 0; seed < 500; seed++) {
        const d = ((seed % 5) + 1) as Difficulty;
        expect(said(generate(mulberry32(seed), d))).not.toMatch(/[{}]|undefined|NaN/);
      }
    }
  });
  it('says numbers plainly', () => {
    const p = { ...base, operands: { kind: 'arith', op: 'add', a: 3, b: 4 }, answer: '7' } as const;
    expect(said(p)).toBe('The answer is 7.');
  });
  it('says clock times the way the question does', () => {
    const at = (hour: number, minute: number): Problem => ({
      ...base,
      operands: { kind: 'clock', hour, minute },
      answer: `${hour}:${minute}`,
    });
    expect(said(at(3, 0))).toBe("It's 3 o'clock.");
    expect(said(at(3, 30))).toBe("It's half past 3.");
  });
  it('names the winner in a compare, whichever side it is on', () => {
    const tap = (a: number, b: number): Problem => ({
      ...base,
      operands: { kind: 'compare', a, b, form: 'tap' },
      answer: a > b ? 'left' : a < b ? 'right' : 'same',
    });
    expect(said(tap(42, 17))).toBe('42 is bigger.');
    expect(said(tap(17, 42))).toBe('42 is bigger.');
    expect(said(tap(17, 17))).toBe('They are the same.');
  });
  it('reads compare signs in order', () => {
    const sign = (a: number, b: number): Problem => ({
      ...base,
      operands: { kind: 'compare', a, b, form: 'symbol' },
      answer: '>',
    });
    expect(said(sign(5, 3))).toBe('5 is greater than 3.');
    expect(said(sign(3, 5))).toBe('3 is less than 5.');
    expect(said(sign(5, 5))).toBe('5 is equal to 5.');
  });
  it('reads a fact-family equation that is true', () => {
    const p: Problem = {
      ...base,
      operands: { kind: 'family', a: 3, b: 4, ask: 'belongs' },
      answer: '7-3=4',
    };
    expect(said(p)).toBe('7 take away 3 is 4.');
  });
});
