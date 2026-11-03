import type { ErrorType } from './state';

export interface Candidate {
  value: number;
  errorType: ErrorType;
}

function regroupSlip(op: 'add' | 'sub', a: number, b: number): number | undefined {
  const [oa, ob] = [a % 10, b % 10];
  if (op === 'add') return oa + ob >= 10 ? a + b - 10 : undefined;
  if (oa >= ob) return undefined;
  // Subtracts the smaller ones digit from the bigger, whichever number it's in.
  return (Math.floor(a / 10) - Math.floor(b / 10)) * 10 + (ob - oa);
}

/** Wrong answers a child is likely to give for a ± b, each tagged with its cause. */
export function arithCandidates(op: 'add' | 'sub', a: number, b: number): Candidate[] {
  const answer = op === 'add' ? a + b : a - b;
  const found: Candidate[] = [
    { value: op === 'add' ? Math.abs(a - b) : a + b, errorType: 'reversed-operation' },
    { value: answer + 1, errorType: 'off-by-one' },
    { value: answer - 1, errorType: 'off-by-one' },
  ];
  const slip = regroupSlip(op, a, b);
  if (slip !== undefined) found.push({ value: slip, errorType: 'didnt-regroup' });
  if (answer >= 10 && answer < 100 && answer % 10 !== 0) {
    const swapped = (answer % 10) * 10 + Math.floor(answer / 10);
    if (swapped !== answer) found.push({ value: swapped, errorType: 'digit-swap' });
  }
  if (a >= 10 || b >= 10) {
    found.push({ value: answer + 10, errorType: 'place-value' });
    found.push({ value: answer - 10, errorType: 'place-value' });
  }
  return found.filter((c) => c.value >= 0 && c.value !== answer);
}
