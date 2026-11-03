import type { Problem } from '@mathapp/engine';
import type { ReactNode } from 'react';
import { Choices, NumberPad, NumberPath, TenFrameTap, type AnswerProps } from './Answers';
import { answerText } from './format';
import { Hint } from './Hint';
import { Prompt } from './Prompt';

interface Props {
  problem: Problem;
  audioOk: boolean;
  onAnswer: AnswerProps['onAnswer'];
  onDigit?: (digit: string) => void;
  tried?: string[];
  /** `hint` is the second try; `reveal` is after two misses, and worked examples. */
  help?: 'none' | 'hint' | 'reveal';
  locked?: boolean;
  /** Sits under the answers: the arrow that moves on from a reveal. */
  footer?: ReactNode;
}

function AnswerArea(props: AnswerProps & { onDigit?: ((digit: string) => void) | undefined }) {
  switch (props.problem.questionType) {
    case 'number-pad':
      return <NumberPad {...props} />;
    case 'ten-frame':
      return <TenFrameTap {...props} />;
    case 'number-line':
      return <NumberPath {...props} />;
    default:
      return <Choices {...props} />;
  }
}

/** One problem: the question and any help on top, the way to answer at the bottom. */
export function ProblemView({
  problem,
  audioOk,
  onAnswer,
  onDigit,
  tried = [],
  help = 'none',
  locked = false,
  footer,
}: Props) {
  const reveal = help === 'reveal';
  const written = reveal ? answerText(problem) : '';
  return (
    <div className="problem-body flex min-h-0 flex-1 flex-col gap-3 landscape:flex-row">
      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto">
        {/* Auto margins centre it, and unlike centring they can't clip the top when it's tall. */}
        <div className="mt-auto" />
        <Prompt problem={problem} audioOk={audioOk} />
        {help !== 'none' && (
          <div
            data-testid="hint"
            className="flex w-full flex-col items-center gap-2 rounded-2xl bg-mist p-2"
          >
            <Hint problem={problem} reveal={reveal} />
            {written && (
              <p data-testid="revealed" className="text-4xl font-extrabold tabular-nums">
                {written}
              </p>
            )}
          </div>
        )}
        <div className="mb-auto" />
      </div>
      <div
        className={`flex shrink-0 flex-col gap-2 landscape:justify-center ${
          problem.questionType === 'number-line' ? 'landscape:w-2/3' : 'landscape:w-1/2'
        }`}
      >
        <AnswerArea
          key={problem.speech.key + JSON.stringify(problem.operands)}
          problem={problem}
          onAnswer={onAnswer}
          onDigit={onDigit}
          tried={tried}
          reveal={reveal}
          locked={locked}
        />
        {footer}
      </div>
    </div>
  );
}
