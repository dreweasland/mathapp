import type { Operands, Problem } from '@mathapp/engine';
import { formatTime } from '@mathapp/engine';
import { Clock } from '../visuals/Clock';
import { BaseTen } from '../visuals/BaseTen';
import { Shape } from '../visuals/Shape';
import {
  AreaGrid,
  Blocks,
  CoinRow,
  DotArray,
  EqualGroups,
  Frac,
  FractionBar,
  FractionLine,
  Pill,
  Ruler,
} from '../visuals/Numbers';
import { DAY_EMOJI, OBJECT_EMOJI, SCENE_EMOJI, STORY_EMOJI } from '../visuals/scenes';
import { TenFrames } from '../visuals/TenFrame';
import { MINUS } from './format';

const Big = ({ children }: { children: React.ReactNode }) => (
  <p className="text-center text-5xl leading-tight font-extrabold tabular-nums">{children}</p>
);
const Blank = () => (
  <span className="mx-1 inline-block min-w-12 border-b-6 border-ink px-1">?</span>
);

function Animals({
  emoji,
  count,
  tint,
}: {
  emoji: string;
  count: number;
  tint?: string | undefined;
}) {
  // Past a dozen, drawing them all stops helping and just fills the screen.
  if (count > 12) {
    return (
      <span aria-hidden="true" className="text-5xl" style={tint ? { filter: tint } : undefined}>
        {emoji}
      </span>
    );
  }
  return (
    <div
      className="flex max-w-40 flex-wrap justify-center text-3xl"
      style={tint ? { filter: tint } : undefined}
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i} data-animal aria-hidden="true">
          {emoji}
        </span>
      ))}
    </div>
  );
}

function WordPicture({ problem }: { problem: Problem }) {
  const { picture, operands } = problem;
  const scene = picture && SCENE_EMOJI[picture.scene];
  if (!picture || !scene) return null;
  const [a = 0, b = 0] = picture.counts;
  const taking = operands.kind === 'arith' && operands.op === 'sub';
  return (
    <div className="flex items-center justify-center gap-3" role="img" aria-label="story picture">
      <div className="text-center">
        <Animals emoji={scene.first} count={a} />
        <p className="text-3xl font-extrabold">{a}</p>
      </div>
      {/* A take-away shows who starts there. The hint shows who left. */}
      {!taking && (
        <>
          <span className="text-4xl font-extrabold">+</span>
          <div className="text-center">
            <Animals emoji={scene.second} count={b} tint={scene.tint} />
            <p className="text-3xl font-extrabold">{b}</p>
          </div>
        </>
      )}
      {taking && (
        <div className="text-center">
          <span className="text-4xl font-extrabold" aria-hidden="true">
            👋
          </span>
          <p className="text-3xl font-extrabold">{b}</p>
        </div>
      )}
    </div>
  );
}

const STEP_SIGN = { add: '+', sub: MINUS, mul: '×', div: '÷' } as const;

/** The story's numbers in order. The speech carries what they mean. */
function StorySteps({ problem }: { problem: Problem }) {
  const o = problem.operands;
  if (o.kind !== 'two-step') return null;
  return (
    <div className="flex flex-col items-center gap-2" role="img" aria-label="story picture">
      <span className="text-6xl" aria-hidden="true">
        {STORY_EMOJI[problem.picture?.scene ?? ''] ?? '📖'}
      </span>
      <div className="flex flex-wrap items-center justify-center gap-2" data-testid="story-steps">
        <Pill>{o.a}</Pill>
        <Pill>
          {STEP_SIGN[o.first]} {o.b}
        </Pill>
        <Pill>
          {STEP_SIGN[o.second]} {o.c}
        </Pill>
      </div>
    </div>
  );
}

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center gap-3 text-5xl font-extrabold">{children}</div>
);

function laterKinds(problem: Problem, o: Operands) {
  switch (o.kind) {
    case 'place-value-3':
      return o.ask === 'value' ? (
        <Blocks hundreds={o.hundreds} tens={o.tens} ones={o.ones} />
      ) : (
        <Big>{100 * o.hundreds + 10 * o.tens + o.ones}</Big>
      );
    case 'skip':
      return (
        <Big>
          {o.from} → <Blank />
        </Big>
      );
    case 'even-odd':
      return <Big>{o.n}</Big>;
    case 'array':
      if (o.form === 'groups') return <EqualGroups groups={o.rows} each={o.cols} />;
      if (o.form === 'area') return <AreaGrid w={o.cols} h={o.rows} />;
      return <DotArray rows={o.rows} cols={o.cols} />;
    case 'money':
      return <CoinRow items={o.items} />;
    case 'make-amount':
      return <Big>{o.target}¢</Big>;
    case 'change':
      return (
        <Big>
          $1 {MINUS} {o.cost}¢
        </Big>
      );
    case 'am-pm':
      return (
        <span className="text-7xl" aria-hidden="true">
          {DAY_EMOJI[o.scene]}
        </span>
      );
    case 'two-step':
      return <StorySteps problem={problem} />;
    case 'ruler':
      return <Ruler length={o.length} unit={o.unit} />;
    case 'estimate':
      return (
        <div className="flex items-center gap-3">
          <span className="text-7xl" aria-hidden="true">
            {OBJECT_EMOJI[o.object]}
          </span>
          <span className="text-4xl font-extrabold">{o.unit}</span>
        </div>
      );
    case 'mult':
      return (
        <Big>
          {o.a} × {o.b} = <Blank />
        </Big>
      );
    case 'div':
      return (
        <Big>
          {o.a} ÷ {o.b} = <Blank />
        </Big>
      );
    case 'share':
      return (
        <Big>
          {o.total} ÷ {o.parts} = <Blank />
        </Big>
      );
    case 'unknown-factor':
      return (
        <Big>
          {o.known} × <Blank /> = {o.product}
        </Big>
      );
    case 'family-md': {
      const product = o.a * o.b;
      return (
        <>
          <p className="text-center text-3xl font-bold">
            {o.a} × {o.b} = {product}
          </p>
          <Big>
            {o.ask === 'flip' ? (
              <>
                {o.b} × {o.a}
              </>
            ) : (
              <>
                {product} ÷ {o.ask === 'div-a' ? o.a : o.b}
              </>
            )}{' '}
            = <Blank />
          </Big>
        </>
      );
    }
    case 'round':
      return (
        <div className="flex items-center gap-3">
          <Big>{o.n}</Big>
          <Pill>≈ {o.to}</Pill>
        </div>
      );
    case 'fraction':
      if (o.form === 'line') return <FractionLine n={o.n} d={o.d} dot={o.ask === 'name'} />;
      return <FractionBar n={o.n} d={o.d} />;
    case 'fraction-compare':
      return o.form === 'symbol' ? (
        <Row>
          <Frac n={o.an} d={o.ad} />
          <Blank />
          <Frac n={o.bn} d={o.bd} />
        </Row>
      ) : (
        <>
          <FractionBar n={o.an} d={o.ad} />
          <FractionBar n={o.bn} d={o.bd} />
        </>
      );
    case 'fraction-equal':
      return (
        <Row>
          <Frac n={o.n} d={o.d} /> = <Frac n={0} d={o.d * o.scale} blank />
        </Row>
      );
    case 'elapsed': {
      const total = o.hour * 60 + o.minute + o.passed;
      const end = { hour: ((Math.floor(total / 60) + 11) % 12) + 1, minute: total % 60 };
      return (
        <div className="flex items-center gap-2">
          <Clock hour={o.hour} minute={o.minute} size={120} />
          {o.ask === 'end' ? (
            <Pill>+{o.passed} min</Pill>
          ) : (
            <>
              <span className="text-3xl font-extrabold">→</span>
              <Clock {...end} size={120} />
            </>
          )}
        </div>
      );
    }
    case 'area':
      return <AreaGrid w={o.w} h={o.h} edge={o.ask === 'perimeter'} />;
    default:
      return null;
  }
}

function kindView(problem: Problem, o: Operands, hearOnly: boolean) {
  const frameQuestion = problem.questionType === 'ten-frame';
  switch (o.kind) {
    case 'arith':
      return (
        <Big>
          {o.a} {o.op === 'add' ? '+' : MINUS} {o.b} = <Blank />
        </Big>
      );
    case 'missing-addend':
      return (
        <>
          {problem.tenFrame && !frameQuestion && <TenFrames a={problem.tenFrame.filled} />}
          <Big>
            {o.known} + <Blank /> = {o.whole}
          </Big>
        </>
      );
    case 'sequence':
      return (
        <Big>
          {o.step === 1 ? (
            <>
              {o.from} → <Blank />
            </>
          ) : (
            <>
              <Blank /> → {o.from}
            </>
          )}
        </Big>
      );
    case 'count':
      return frameQuestion ? (
        <Big>{o.value}</Big>
      ) : (
        <TenFrames a={problem.tenFrame?.filled ?? o.value} />
      );
    case 'numeral':
      // The skill is matching a spoken number, so the digits only appear with no sound.
      return hearOnly ? <Big>{o.value}</Big> : <Big>👂</Big>;
    case 'compare':
      return o.form === 'symbol' ? (
        <Big>
          {o.a} <Blank /> {o.b}
        </Big>
      ) : (
        <Big>🐊</Big>
      );
    case 'place-value':
      if (o.ask === 'value') return <BaseTen tens={o.tens} ones={o.ones} />;
      return <Big>{o.tens * 10 + o.ones}</Big>;
    case 'family': {
      const whole = o.a + o.b;
      if (o.ask === 'belongs') return <Big>{`${o.a}, ${o.b}, ${whole}`}</Big>;
      return (
        <>
          <p className="text-center text-3xl font-bold">
            {o.a} + {o.b} = {whole}
          </p>
          <Big>
            {o.ask === 'flip' ? (
              <>
                {o.b} + {o.a}
              </>
            ) : (
              <>
                {whole} {MINUS} {o.ask === 'sub-a' ? o.a : o.b}
              </>
            )}{' '}
            = <Blank />
          </Big>
        </>
      );
    }
    case 'clock':
      return problem.questionType === 'clock-face' ? (
        <Big>{formatTime(o.hour, o.minute)}</Big>
      ) : (
        <div className="flex justify-center">
          <Clock hour={o.hour} minute={o.minute} size={170} />
        </div>
      );
    case 'shape-name':
      return <p className="text-center text-4xl font-extrabold">{o.shape}</p>;
    case 'shape-sides':
      return (
        <div className="flex justify-center">
          <Shape shape={o.shape} size={130} />
        </div>
      );
    case 'shares':
      return <p className="text-center text-4xl font-extrabold">{o.parts === 2 ? '½' : '¼'}</p>;
    case 'lengths':
      return <Big>📏</Big>;
    default:
      return laterKinds(problem, o);
  }
}

/** What's on screen for the problem itself. The speech carries the rest. */
export function Prompt({ problem, audioOk }: { problem: Problem; audioOk: boolean }) {
  const isStory = problem.operands.kind === 'arith' && problem.picture !== undefined;
  return (
    <div className="flex flex-col items-center gap-2" data-testid="prompt">
      {isStory ? <WordPicture problem={problem} /> : kindView(problem, problem.operands, !audioOk)}
    </div>
  );
}
