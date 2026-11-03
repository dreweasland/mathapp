// @vitest-environment jsdom
import { GENERATORS, mulberry32, type Difficulty, type Problem } from '@mathapp/engine';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { answerText, orderedChoices } from './format';
import { ProblemView } from './ProblemView';

afterEach(cleanup);
vi.setConfig({ testTimeout: 60_000 });

const LEVELS: Difficulty[] = [1, 2, 3, 4, 5];

function everyProblem(seeds = 24): Problem[] {
  return Object.values(GENERATORS).flatMap((generate) =>
    LEVELS.flatMap((d) => Array.from({ length: seeds }, (_, i) => generate(mulberry32(i * 31), d))),
  );
}

const show = (problem: Problem, over = {}) => {
  const onAnswer = vi.fn();
  const view = render(<ProblemView problem={problem} audioOk onAnswer={onAnswer} {...over} />);
  return { onAnswer, ...view };
};

function giveAnswer(problem: Problem, container: HTMLElement) {
  const box = within(container);
  if (problem.questionType === 'number-pad') {
    for (const digit of problem.answer) {
      fireEvent.click(box.getByRole('button', { name: digit }));
    }
    fireEvent.click(box.getByRole('button', { name: 'check' }));
  } else if (problem.questionType === 'ten-frame') {
    const given = problem.tenFrame?.filled ?? 0;
    for (let i = 0; i < Number(problem.answer); i++) {
      fireEvent.click(box.getByRole('button', { name: `square ${given + i + 1}` }));
    }
    fireEvent.click(box.getByRole('button', { name: 'check' }));
  } else {
    const button = container.querySelector(`[data-value="${problem.answer}"]`);
    if (!button) throw new Error(`No button for ${problem.answer}: ${JSON.stringify(problem)}`);
    fireEvent.click(button);
  }
}

describe('every problem a generator can make', () => {
  const problems = everyProblem();

  it('can be answered correctly through the screen', () => {
    for (const problem of problems) {
      const { onAnswer, container, unmount } = show(problem);
      giveAnswer(problem, container);
      expect(onAnswer, JSON.stringify(problem)).toHaveBeenCalledOnce();
      const value = onAnswer.mock.calls[0]?.[0] as string;
      expect(value, JSON.stringify(problem)).toBe(problem.answer);
      unmount();
    }
  });

  it('has a hint that draws something', () => {
    for (const problem of problems) {
      const { unmount } = show(problem, { help: 'hint' });
      expect(screen.getByTestId('hint').childElementCount, JSON.stringify(problem)).toBeGreaterThan(
        0,
      );
      unmount();
    }
  });

  it('never gives the answer away in a counting hint', () => {
    const KINDS = ['money', 'array', 'mult', 'area', 'div', 'share'];
    for (const problem of problems) {
      if (!KINDS.includes(problem.operands.kind)) continue;
      const { unmount } = show(problem, { help: 'hint' });
      const shown = screen.getByTestId('hint').textContent?.match(/\d+/g) ?? [];
      const sides =
        problem.operands.kind === 'area'
          ? [problem.operands.w, problem.operands.h].map(String)
          : [];
      if (!sides.includes(problem.answer)) {
        expect(shown, JSON.stringify(problem)).not.toContain(problem.answer);
      }
      unmount();
    }
  });

  it('never gives the answer away in a shape hint', () => {
    let checked = 0;
    for (const problem of problems) {
      const o = problem.operands;
      if (o.kind !== 'shape-name' && o.kind !== 'shape-sides' && o.kind !== 'shares') continue;
      checked++;
      const { unmount } = show(problem, { help: 'hint' });
      const hint = screen.getByTestId('hint');
      const where = JSON.stringify(problem);
      if (o.kind === 'shape-name') {
        // The clue describes the shape; it never draws it to be matched.
        expect(hint.querySelector(`[aria-label="${o.shape}"]`), where).toBeNull();
      }
      if (o.kind === 'shape-sides') {
        expect(hint.textContent?.match(/\d+/g) ?? [], where).not.toContain(problem.answer);
      }
      if (o.kind === 'shares') {
        const answerPicture = `${o.shape} in ${o.parts} equal parts`;
        expect(hint.querySelector(`[aria-label="${answerPicture}"]`), where).toBeNull();
      }
      unmount();
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('shows the real answer on reveal', () => {
    for (const problem of problems) {
      const { container, unmount } = show(problem, { help: 'reveal' });
      const where = JSON.stringify(problem);
      expect(screen.getByTestId('hint').childElementCount, where).toBeGreaterThan(0);
      if (problem.questionType === 'number-pad') {
        expect(container.querySelector('.tap-answer')?.textContent, where).toBe(problem.answer);
      } else if (problem.questionType === 'ten-frame') {
        const dots = container.querySelectorAll('[data-dot="given"], .bg-leaf');
        expect(container.querySelectorAll('button .bg-leaf').length, where).toBe(
          Number(problem.answer),
        );
        expect(dots.length, where).toBeGreaterThanOrEqual(Number(problem.answer));
      } else {
        const marked = container.querySelector('.tap-answer');
        expect(marked?.getAttribute('data-value'), where).toBe(problem.answer);
      }
      unmount();
    }
  });
});

describe('the written answer', () => {
  it('is a true equation for arithmetic', () => {
    for (const problem of everyProblem(20)) {
      if (problem.operands.kind !== 'arith') continue;
      const { a, b, op } = problem.operands;
      expect(answerText(problem)).toBe(`${a} ${op === 'add' ? '+' : '−'} ${b} = ${problem.answer}`);
    }
  });
});

describe('choice order', () => {
  it('keeps left on the left and right on the right, however they were shuffled', () => {
    for (const problem of everyProblem(30)) {
      if (problem.operands.kind === 'compare' && problem.operands.form === 'tap') {
        const order = orderedChoices(problem);
        expect(order.indexOf('left')).toBeLessThan(order.indexOf('right'));
        expect(order.includes('same')).toBe(true);
      }
    }
  });
  it('never drops a choice', () => {
    for (const problem of everyProblem(30)) {
      expect(orderedChoices(problem).sort()).toEqual(
        (problem.choices ?? []).map((c) => c.value).sort(),
      );
    }
  });
});

describe('number pad', () => {
  const pad: Problem = {
    skillId: 'x',
    questionType: 'number-pad',
    difficulty: 1,
    operands: { kind: 'arith', op: 'add', a: 3, b: 4 },
    answer: '7',
    speech: { key: 'q.add' },
    hint: { visual: 'counters', params: { a: 3, b: 4 } },
  };
  it('cannot be checked empty', () => {
    show(pad);
    expect(screen.getByRole('button', { name: 'check' }).hasAttribute('disabled')).toBe(true);
  });
  it('erases', () => {
    show(pad);
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: 'erase' }));
    expect(screen.getByLabelText('your answer').textContent).toBe('4');
  });
  it('a leading zero is replaced', () => {
    show(pad);
    fireEvent.click(screen.getByRole('button', { name: '0' }));
    fireEvent.click(screen.getByRole('button', { name: '7' }));
    expect(screen.getByLabelText('your answer').textContent).toBe('7');
  });
  it('stops at four digits, enough for 1000', () => {
    show(pad);
    for (const d of ['1', '0', '0', '0', '5']) {
      fireEvent.click(screen.getByRole('button', { name: d }));
    }
    expect(screen.getByLabelText('your answer').textContent).toBe('1000');
  });
  it('clears after checking, ready for the second try', () => {
    const { onAnswer } = show(pad);
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    fireEvent.click(screen.getByRole('button', { name: 'check' }));
    expect(onAnswer.mock.calls[0]?.[0]).toBe('9');
    expect(screen.getByLabelText('your answer').textContent?.trim()).toBe('');
  });
});

describe('tried choices', () => {
  it('cannot be tapped again', () => {
    const problem = GENERATORS['1.add-within-10'] as NonNullable<(typeof GENERATORS)[string]>;
    for (let seed = 0; seed < 50; seed++) {
      const p = problem(mulberry32(seed), 1);
      if (p.questionType !== 'multiple-choice') continue;
      const wrong = p.choices?.find((c) => c.value !== p.answer)?.value as string;
      const { container, onAnswer } = show(p, { tried: [wrong] });
      const button = container.querySelector(`[data-value="${wrong}"]`) as HTMLButtonElement;
      fireEvent.click(button);
      expect(button.disabled).toBe(true);
      expect(onAnswer).not.toHaveBeenCalled();
      return;
    }
    throw new Error('no multiple-choice sample');
  });
});

describe('numeral problems', () => {
  const numeral = Object.values(GENERATORS)
    .flatMap((g) => Array.from({ length: 200 }, (_, i) => g(mulberry32(i), 3)))
    .find((p) => p.operands.kind === 'numeral') as Problem;
  it('keep the number out of sight, because hearing it is the skill', () => {
    show(numeral);
    expect(screen.getByTestId('prompt').textContent).not.toContain(numeral.answer);
  });
  it('show it if the device has no speech, so it can still be answered', () => {
    show(numeral, { audioOk: false });
    expect(screen.getByTestId('prompt').textContent).toContain(numeral.answer);
  });
});
