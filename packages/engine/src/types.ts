import type { ErrorType, LocalDate, SkillState } from './state';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type QuestionType =
  | 'multiple-choice'
  | 'number-pad'
  | 'ten-frame'
  | 'number-line'
  /** Tap the bigger of two things, or "same". Replaces the brief's "true/false compare". */
  | 'compare'
  | 'clock-face';

export type ShapeName =
  'circle' | 'square' | 'triangle' | 'rectangle' | 'hexagon' | 'trapezoid' | 'rhombus';

/**
 * The math behind a problem, as data. The audit recomputes every answer from this in
 * separate solver code, so a generator can't vouch for its own answer key.
 */
export type Operands =
  | { kind: 'arith'; op: 'add' | 'sub'; a: number; b: number }
  | { kind: 'missing-addend'; whole: number; known: number }
  | { kind: 'sequence'; from: number; step: 1 | -1 }
  | { kind: 'count'; value: number }
  | { kind: 'numeral'; value: number }
  | { kind: 'compare'; a: number; b: number; form: 'tap' | 'symbol' }
  | { kind: 'place-value'; tens: number; ones: number; ask: 'value' | 'tens' | 'ones' }
  | { kind: 'family'; a: number; b: number; ask: 'flip' | 'sub-a' | 'sub-b' | 'belongs' }
  | { kind: 'clock'; hour: number; minute: number }
  | { kind: 'shape-name'; shape: ShapeName }
  | { kind: 'shape-sides'; shape: ShapeName }
  | { kind: 'shares'; shape: 'circle' | 'square' | 'rectangle'; parts: 2 | 4 }
  | { kind: 'lengths'; lengths: number[]; ask: 'longest' | 'shortest' | 'middle' }
  // Grade 2
  | {
      kind: 'place-value-3';
      hundreds: number;
      tens: number;
      ones: number;
      ask: 'value' | 'hundreds' | 'tens' | 'ones';
    }
  /** Skip counting. `step` is negative when counting back. */
  | { kind: 'skip'; from: number; step: number }
  | { kind: 'even-odd'; n: number }
  | { kind: 'array'; rows: number; cols: number; form: 'array' | 'groups' | 'area' }
  /** `items` are in cents, so a dollar bill is 100. */
  | { kind: 'money'; items: number[]; unit: 'cents' | 'dollars' }
  /** Choices are coin lists like "25+10". */
  | { kind: 'make-amount'; target: number }
  | { kind: 'change'; paid: number; cost: number }
  | { kind: 'am-pm'; scene: string; part: 'a.m.' | 'p.m.' }
  /** Worked left to right: (a first b) second c. */
  | { kind: 'two-step'; a: number; b: number; c: number; first: StepOp; second: StepOp }
  | { kind: 'ruler'; length: number; unit: 'in' | 'cm' }
  | { kind: 'estimate'; object: string; unit: 'in' | 'cm'; actual: number }
  // Grade 3
  | { kind: 'mult'; a: number; b: number }
  | { kind: 'div'; a: number; b: number }
  | { kind: 'share'; total: number; parts: number; ask: 'each' | 'groups' }
  | { kind: 'unknown-factor'; known: number; product: number }
  | { kind: 'family-md'; a: number; b: number; ask: 'flip' | 'div-a' | 'div-b' }
  | { kind: 'round'; n: number; to: 10 | 100 }
  | { kind: 'fraction'; n: number; d: number; form: 'shape' | 'line'; ask: 'name' | 'parts' }
  | {
      kind: 'fraction-compare';
      an: number;
      ad: number;
      bn: number;
      bd: number;
      form: 'tap' | 'symbol';
    }
  /** n/d = ?/(d × scale) */
  | { kind: 'fraction-equal'; n: number; d: number; scale: number }
  | { kind: 'elapsed'; hour: number; minute: number; passed: number; ask: 'end' | 'minutes' }
  | { kind: 'area'; w: number; h: number; ask: 'area' | 'perimeter' };

export type StepOp = 'add' | 'sub' | 'mul' | 'div';

export interface Choice {
  value: string;
  /** What misunderstanding picking this choice suggests. */
  errorType?: ErrorType;
}

export interface Speech {
  key: string;
  params?: Record<string, string | number>;
}

export type HintVisual =
  | 'ten-frame'
  | 'double-ten-frame'
  | 'number-line'
  | 'counters'
  | 'base-ten'
  | 'alligator'
  | 'clock'
  | 'shape'
  | 'bars'
  | 'place-chart'
  | 'pairs'
  | 'groups'
  | 'coins'
  | 'ruler'
  | 'fraction-bars'
  | 'round-line'
  | 'area-grid'
  | 'steps';

export interface Hint {
  visual: HintVisual;
  params?: Record<string, number | string>;
}

export interface Picture {
  scene: string;
  counts: number[];
}

export interface Problem {
  skillId: string;
  questionType: QuestionType;
  difficulty: Difficulty;
  operands: Operands;
  /** Always a string, so taps and number-pad entry compare the same way. */
  answer: string;
  choices?: Choice[];
  speech: Speech;
  hint: Hint;
  /** Word problems always have one. */
  picture?: Picture;
  /** Set when this problem is a tracked fact card. */
  factId?: string;
  /** For the `ten-frame` type: dots already showing. */
  tenFrame?: { filled: number };
  /** For the `number-line` type. */
  numberLine?: { min: number; max: number };
}

export type Generator = (rng: import('./rng').Rng, difficulty: Difficulty) => Problem;

export interface SkillDef {
  id: string;
  grade: 1 | 2 | 3;
  /** CCSS code(s). */
  standard: string;
  name: string;
  kidName: string;
  /** Speech key for the kid name. */
  speechKey: string;
  badgeName: string;
  prerequisites: string[];
  questionTypes: QuestionType[];
  /** A correct answer at or under this counts as fast. */
  fastMs: number;
  /** True when problems feed the Leitner fact deck. */
  factBased: boolean;
  mastery: { threshold: number; minAttempts: number };
  /** Tie-break for frontier selection. */
  order: number;
}

export interface CollectibleSet {
  id: string;
  /** About 12, all visible to the child from the start. */
  items: string[];
  /** Added to the child's scenes when the set is complete. */
  decoration: string;
}

export type CosmeticSlot = 'hat' | 'accessory' | 'background';

export interface Cosmetic {
  id: string;
  slot: CosmeticSlot;
  price: number;
}

/** One problem's result, however many tries it took. */
export type ItemOutcome = 'fast' | 'slow' | 'second-try' | 'missed';

export type SkillStates = Record<string, SkillState | undefined>;
export type { LocalDate };
