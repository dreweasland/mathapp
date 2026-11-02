import { useState } from 'react';
import type { Problem } from '@mathapp/engine';
import { Clock } from '../visuals/Clock';
import { LengthBar, lengthObjects } from '../visuals/Lengths';
import { Shape, Shares } from '../visuals/Shape';
import { orderedChoices, prettyMath } from './format';

export interface AnswerProps {
  problem: Problem;
  /** Stops the response clock when given. */
  onAnswer: (value: string, stoppedAt?: number) => void;
  tried: string[];
  /** Shows the answer and takes no input. */
  reveal: boolean;
  locked: boolean;
}

const stateClass = (reveal: boolean, isAnswer: boolean, wasTried: boolean) => {
  if (reveal && isAnswer) return 'tap-answer';
  return reveal || wasTried ? 'tap-used' : '';
};

function parseClock(value: string) {
  const [hour = '12', minute = '0'] = value.split(':');
  return { hour: Number(hour), minute: Number(minute) };
}

function ChoiceFace({ problem, value }: { problem: Problem; value: string }) {
  const o = problem.operands;
  if (o.kind === 'clock' && problem.questionType === 'clock-face') {
    return <Clock {...parseClock(value)} size={112} />;
  }
  if (o.kind === 'shape-name') return <Shape shape={value as typeof o.shape} size={76} />;
  if (o.kind === 'shares') {
    const [shape, parts, cut] = value.split(':');
    return (
      <Shares
        shape={shape as typeof o.shape}
        parts={Number(parts)}
        equal={cut === 'equal'}
        size={84}
      />
    );
  }
  if (o.kind === 'lengths') {
    const index = value === 'left' ? 0 : value === 'right' ? 1 : Number(value);
    const objects = lengthObjects(problem.picture?.scene ?? '');
    return (
      <LengthBar
        index={index}
        length={o.lengths[index] ?? 1}
        longest={Math.max(...o.lengths)}
        object={objects[index] ?? ''}
      />
    );
  }
  if (o.kind === 'compare' && o.form === 'tap') {
    return <>{value === 'left' ? o.a : value === 'right' ? o.b : '='}</>;
  }
  return <>{o.kind === 'family' && o.ask === 'belongs' ? prettyMath(value) : value}</>;
}

function choiceLabel(problem: Problem, value: string) {
  const o = problem.operands;
  if (o.kind === 'compare' && o.form === 'tap') {
    return value === 'left' ? String(o.a) : value === 'right' ? String(o.b) : 'same';
  }
  if (o.kind === 'lengths') return `choice ${value}`;
  return value;
}

function layoutFor(problem: Problem, count: number) {
  const o = problem.operands;
  if (o.kind === 'lengths') return 'grid-cols-1';
  if (o.kind === 'family' && o.ask === 'belongs') return 'grid-cols-1';
  if (problem.questionType === 'clock-face') return 'grid-cols-2';
  return count === 3 ? 'grid-cols-3' : 'grid-cols-2';
}

export function Choices({ problem, onAnswer, tried, reveal, locked }: AnswerProps) {
  const values = orderedChoices(problem);
  const text = problem.operands.kind === 'family' ? 'text-3xl' : 'text-4xl';
  return (
    <div className={`grid gap-3 ${layoutFor(problem, values.length)}`}>
      {values.map((value) => {
        const wasTried = tried.includes(value);
        return (
          <button
            key={value}
            type="button"
            data-value={value}
            aria-label={choiceLabel(problem, value)}
            disabled={wasTried || reveal || locked}
            onClick={() => onAnswer(value)}
            className={`tap min-h-20 p-2 font-extrabold ${text} ${stateClass(reveal, value === problem.answer, wasTried)}`}
          >
            <ChoiceFace problem={problem} value={value} />
          </button>
        );
      })}
    </div>
  );
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const MAX_DIGITS = 3;

export function NumberPad({
  problem,
  onAnswer,
  reveal,
  locked,
  onDigit,
}: AnswerProps & { onDigit?: (digit: string) => void }) {
  const [entry, setEntry] = useState('');
  const [lastDigitAt, setLastDigitAt] = useState(0);
  const press = (digit: string) => {
    setLastDigitAt(Date.now());
    onDigit?.(digit);
    setEntry((e) => (e === '0' ? digit : (e + digit).slice(0, MAX_DIGITS)));
  };
  const check = () => {
    setEntry('');
    onAnswer(entry, lastDigitAt);
  };
  if (reveal) {
    return (
      <p className="tap tap-answer flex min-h-20 items-center justify-center text-5xl font-extrabold">
        {problem.answer}
      </p>
    );
  }
  const key = 'tap min-h-16 text-4xl font-extrabold';
  return (
    <div className="flex flex-col gap-2">
      <output
        aria-label="your answer"
        className="flex h-16 items-center justify-center rounded-2xl border-4 border-dashed border-ink/40 bg-white text-5xl font-extrabold tabular-nums"
      >
        {entry || ' '}
      </output>
      <div className="pad-keys grid grid-cols-3 gap-2">
        {KEYS.map((n) => (
          <button key={n} type="button" className={key} disabled={locked} onClick={() => press(n)}>
            {n}
          </button>
        ))}
        <button
          type="button"
          aria-label="erase"
          className={key}
          disabled={locked || entry === ''}
          onClick={() => setEntry((e) => e.slice(0, -1))}
        >
          ⌫
        </button>
        <button type="button" className={key} disabled={locked} onClick={() => press('0')}>
          0
        </button>
        <button
          type="button"
          aria-label="check"
          className={`${key} tap-primary`}
          disabled={locked || entry === ''}
          onClick={check}
        >
          ✓
        </button>
      </div>
    </div>
  );
}

const FRAME_CELLS = Array.from({ length: 10 }, (_, i) => i);

/** Tap empty cells to fill them. Dots the problem starts with stay put. */
export function TenFrameTap({ problem, onAnswer, reveal, locked }: AnswerProps) {
  const given = problem.tenFrame?.filled ?? 0;
  const [tapped, setTapped] = useState<number[]>([]);
  const answer = Number(problem.answer);
  const revealed = FRAME_CELLS.slice(given, given + answer);
  const toggle = (cell: number) =>
    setTapped((t) => (t.includes(cell) ? t.filter((c) => c !== cell) : [...t, cell]));
  const check = () => {
    setTapped([]);
    onAnswer(String(tapped.length));
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-1 rounded-xl border-4 border-ink bg-ink p-1">
        {FRAME_CELLS.map((cell) => {
          const fixed = cell < given;
          const on = reveal ? revealed.includes(cell) : tapped.includes(cell);
          return (
            <button
              key={cell}
              type="button"
              aria-label={`square ${cell + 1}`}
              aria-pressed={fixed || on}
              disabled={fixed || reveal || locked}
              onClick={() => toggle(cell)}
              className="flex aspect-square min-h-16 items-center justify-center rounded-lg bg-white"
            >
              {(fixed || on) && (
                <span
                  data-dot={fixed ? 'given' : 'tapped'}
                  className={`block h-3/4 w-3/4 rounded-full ${reveal && on ? 'bg-leaf' : fixed ? 'bg-sky' : 'bg-sun'}`}
                />
              )}
            </button>
          );
        })}
      </div>
      {!reveal && (
        <button
          type="button"
          aria-label="check"
          className="tap tap-primary min-h-18 text-4xl font-extrabold"
          disabled={locked}
          onClick={check}
        >
          ✓
        </button>
      )}
    </div>
  );
}

/** At 64px per target, a 0–20 line can't fit an iPhone, so it wraps into a number path. */
export function NumberPath({ problem, onAnswer, tried, reveal, locked }: AnswerProps) {
  const { min = 0, max = 10 } = problem.numberLine ?? {};
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1.5"
      data-testid="number-path"
    >
      {numbers.map((n) => {
        const wasTried = tried.includes(n);
        return (
          <button
            key={n}
            type="button"
            data-value={n}
            disabled={wasTried || reveal || locked}
            onClick={() => onAnswer(n)}
            className={`tap min-h-16 text-3xl font-extrabold tabular-nums ${stateClass(reveal, n === problem.answer, wasTried)}`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
