import type { Problem } from '@mathapp/engine';

export const MINUS = '−';

/** Math as shown on screen. Uses a true minus sign, and spaces a child can read. */
export const prettyMath = (text: string) =>
  text.replace(/-/g, ` ${MINUS} `).replace(/\+/g, ' + ').replace(/=/g, ' = ');

/** The answer written out, for the reveal. */
export function answerText(problem: Problem): string {
  const o = problem.operands;
  if (o.kind === 'arith') {
    return `${o.a} ${o.op === 'add' ? '+' : MINUS} ${o.b} = ${problem.answer}`;
  }
  if (o.kind === 'missing-addend') return `${o.known} + ${problem.answer} = ${o.whole}`;
  if (o.kind === 'compare') {
    const sign = o.a > o.b ? '>' : o.a < o.b ? '<' : '=';
    return `${o.a} ${sign} ${o.b}`;
  }
  if (o.kind === 'family' && o.ask === 'belongs') return prettyMath(problem.answer);
  if (o.kind === 'family') {
    if (o.ask === 'flip') return `${o.b} + ${o.a} = ${problem.answer}`;
    const taken = o.ask === 'sub-a' ? o.a : o.b;
    return `${o.a + o.b} ${MINUS} ${taken} = ${problem.answer}`;
  }
  if (o.kind === 'shape-sides' || o.kind === 'count' || o.kind === 'sequence')
    return problem.answer;
  if (o.kind === 'numeral' || o.kind === 'place-value') return problem.answer;
  const { answer } = problem;
  switch (o.kind) {
    case 'place-value-3':
    case 'skip':
    case 'array':
    case 'ruler':
    case 'estimate':
    case 'even-odd':
    case 'am-pm':
    case 'round':
    case 'share':
      return answer;
    case 'money':
      return o.unit === 'dollars' ? `$${answer}` : `${answer}¢`;
    case 'change':
      return `${answer}¢`;
    case 'two-step':
      return answer;
    case 'mult':
      return `${o.a} × ${o.b} = ${answer}`;
    case 'div':
      return `${o.a} ÷ ${o.b} = ${answer}`;
    case 'unknown-factor':
      return `${o.known} × ${answer} = ${o.product}`;
    case 'family-md': {
      const product = o.a * o.b;
      if (o.ask === 'flip') return `${o.b} × ${o.a} = ${answer}`;
      return `${product} ÷ ${o.ask === 'div-a' ? o.a : o.b} = ${answer}`;
    }
    case 'fraction':
      return answer;
    case 'fraction-equal':
      return `${o.n}/${o.d} = ${answer}/${o.d * o.scale}`;
    case 'fraction-compare': {
      const left = o.an * o.bd;
      const right = o.bn * o.ad;
      const sign = left > right ? '>' : left < right ? '<' : '=';
      return `${o.an}/${o.ad} ${sign} ${o.bn}/${o.bd}`;
    }
    case 'elapsed':
      return o.ask === 'end' ? answer : `${answer} min`;
    case 'area':
      return `${answer}`;
    default:
      return '';
  }
}

/** Choices keep a fixed place where position has meaning, like the left and right of a compare. */
export function orderedChoices(problem: Problem): string[] {
  const values = problem.choices?.map((c) => c.value) ?? [];
  const o = problem.operands;
  if ((o.kind === 'compare' || o.kind === 'fraction-compare') && o.form === 'tap') {
    return ['left', 'right', 'same'].filter((v) => values.includes(v));
  }
  if (o.kind === 'lengths')
    return ['left', 'right', '0', '1', '2'].filter((v) => values.includes(v));
  return values;
}
