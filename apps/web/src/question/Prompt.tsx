import type { Operands, Problem } from '@mathapp/engine';
import { Clock } from '../visuals/Clock';
import { BaseTen } from '../visuals/BaseTen';
import { Shape } from '../visuals/Shape';
import { SCENE_EMOJI } from '../visuals/scenes';
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
        <Big>{`${o.hour}:${o.minute === 0 ? '00' : o.minute}`}</Big>
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
  }
}

/** What's on screen for the problem itself. The speech carries the rest. */
export function Prompt({ problem, audioOk }: { problem: Problem; audioOk: boolean }) {
  const isStory = problem.skillId === '1.word-problems';
  return (
    <div className="flex flex-col items-center gap-2" data-testid="prompt">
      {isStory ? <WordPicture problem={problem} /> : kindView(problem, problem.operands, !audioOk)}
    </div>
  );
}
