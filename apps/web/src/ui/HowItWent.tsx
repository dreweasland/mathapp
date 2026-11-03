import { answerSpeech, render } from '@mathapp/content';
import { summarizeRun, type Problem, type ProblemResultKind, type QuestRun } from '@mathapp/engine';
import { useState } from 'react';
import { Icon, type IconName } from './icons';

const KIND: Record<ProblemResultKind, { icon: IconName; label: string }> = {
  'first-try': { icon: 'done', label: 'Right first try' },
  'second-try': { icon: 'star', label: 'Got it on the second try' },
  shown: { icon: 'bulb', label: 'Bo showed you how' },
};

const say = (key: string, params?: Record<string, string | number>) => {
  try {
    return render(key, params);
  } catch {
    return '';
  }
};

/** A tried answer worth showing: numbers, times and shape names, not positions or codes. */
const readable = (problem: Problem, value: string) => {
  const kind = problem.operands.kind;
  if (kind === 'lengths' || kind === 'make-amount' || kind === 'shares') return false;
  if (['left', 'right', 'same'].includes(value)) return false;
  return /^[\w$¢./: -]+$/.test(value);
};

/**
 * How the quest went: three counts, framed as effort, and every problem behind them.
 * Nothing here is red or a cross: a miss is something Bo showed you, and it comes back to practise.
 */
export function HowItWent({ run }: { run: QuestRun }) {
  const [open, setOpen] = useState(false);
  const summary = summarizeRun(run);
  if (summary.items.length === 0) return null;
  const counts: [ProblemResultKind, number][] = [
    ['first-try', summary.firstTry],
    ['second-try', summary.secondTry],
    ['shown', summary.shown],
  ];
  return (
    <section data-testid="how-it-went" className="card w-full text-left">
      <h2 className="section-label">How it went · {summary.items.length} problems</h2>
      <ul className="mt-1">
        {counts.map(([kind, n]) => (
          <li
            key={kind}
            data-kind={kind}
            className="flex items-center gap-3 py-1.5 text-lg font-extrabold"
          >
            <Icon name={KIND[kind].icon} size={30} />
            <span className="flex-1 leading-tight">
              {KIND[kind].label}
              {kind === 'shown' && n > 0 && (
                <span className="block text-xs font-bold text-ink-soft">
                  These come back soon, so you can practise them
                </span>
              )}
            </span>
            <span className="text-xl font-black" data-testid={`count-${kind}`}>
              {n}
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="tap mt-2 min-h-16 w-full gap-2 text-lg font-extrabold"
      >
        <Icon name={open ? 'back' : 'arrow'} size={22} />
        {open ? 'Hide the problems' : 'See every problem'}
      </button>
      {open && (
        <ol data-testid="problem-list" className="mt-2 flex flex-col">
          {summary.items.map((item) => {
            const tried = item.tried.filter((v) => readable(item.problem, v));
            return (
              <li
                key={`${item.section}.${item.item}`}
                data-result={item.result}
                className="flex gap-2.5 border-t-2 border-dashed border-line py-2 first:border-t-0"
              >
                <Icon name={KIND[item.result].icon} size={24} className="mt-0.5" />
                <span className="flex min-w-0 flex-col text-sm leading-snug">
                  <span className="font-bold">
                    {say(item.problem.speech.key, item.problem.speech.params)}
                  </span>
                  <span className="font-extrabold">
                    {say(answerSpeech(item.problem).key, answerSpeech(item.problem).params)}
                  </span>
                  {tried.length > 0 && (
                    <span className="text-ink-soft">You tried {tried.join(', then ')}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
