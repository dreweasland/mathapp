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
  | { kind: 'lengths'; lengths: number[]; ask: 'longest' | 'shortest' | 'middle' };

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
  | 'bars';

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
