/**
 * Development only: one screen per problem, addressed from the URL, for layout tests and
 * screenshots. `gallery.html` is not a build input, so none of this ships.
 *
 *   /gallery.html?skill=1.time&level=3&seed=7&type=clock-face&help=hint
 */
import { GENERATORS, mulberry32, type Difficulty, type Problem } from '@mathapp/engine';
import { createRoot } from 'react-dom/client';
import { ProblemView } from './question/ProblemView';
import './index.css';

const query = new URLSearchParams(location.search);
const skill = query.get('skill') ?? '1.add-within-10';
const level = Number(query.get('level') ?? 3) as Difficulty;
const type = query.get('type');
const kind = query.get('kind');
const help = (query.get('help') ?? 'none') as 'none' | 'hint' | 'reveal';
const generate = GENERATORS[skill];

function find(): Problem | undefined {
  for (let seed = Number(query.get('seed') ?? 0); seed < 5000; seed++) {
    const problem = generate?.(mulberry32(seed), level);
    if (!problem) return undefined;
    if (type && problem.questionType !== type) continue;
    if (kind && problem.operands.kind !== kind) continue;
    return problem;
  }
  return undefined;
}

const problem = find();

createRoot(document.getElementById('root') as HTMLElement).render(
  <main className="screen">
    <header className="flex items-center gap-2">
      <button type="button" className="tap px-3 text-4xl" aria-label="home">
        🏠
      </button>
      <div className="h-6 flex-1 rounded-full border-3 border-ink bg-white" />
      <button type="button" className="tap px-3 text-4xl" aria-label="say it again">
        🔊
      </button>
    </header>
    {problem ? (
      <ProblemView problem={problem} audioOk help={help} onAnswer={() => undefined} />
    ) : (
      <p data-testid="none">none</p>
    )}
  </main>,
);
