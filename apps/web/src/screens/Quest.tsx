import { render, skillById } from '@mathapp/content';
import {
  COINS,
  currentItem,
  currentSection,
  type QuestRun,
  type QuestSection,
} from '@mathapp/engine';
import { useGame } from '../game/GameProvider';
import { ProblemView } from '../question/ProblemView';
import { BearSays } from '../ui/BearSays';
import { BigButton, IconButton } from '../ui/BigButton';
import { Icon, type IconName } from '../ui/icons';
import { MyMascot } from '../ui/MyMascot';

type Kind = QuestSection['kind'];

export const STEP: Record<Kind, { name: string; icon: IconName }> = {
  warmup: { name: 'Warm-up', icon: 'sun' },
  skill: { name: 'Learn', icon: 'bulb' },
  challenge: { name: 'Bonus', icon: 'star' },
};

/** What each step is, in a few words a grown-up can read aloud too. */
function about(section: QuestSection, run: QuestRun): string {
  const count = section.items.length;
  if (section.kind === 'warmup') return `${count} quick ones you already know`;
  if (section.kind === 'challenge') return `${count} trickier ones, just for fun`;
  const skill = skillById(run.quest.todaySkillId);
  return skill ? `${count} problems: ${render(skill.speechKey)}` : `${count} problems`;
}

/** Where you are in today's quest: one bar per step, named, with the current one filling up. */
function StepBar({ run }: { run: QuestRun }) {
  const sections = run.quest.sections;
  const feedbackDone = run.stage === 'feedback' ? 1 : 0;
  const practice = run.quest.free === true;
  return (
    <div
      role="progressbar"
      aria-label="progress"
      aria-valuenow={run.item + feedbackDone}
      aria-valuemax={sections[run.section]?.items.length ?? 0}
      className="flex min-w-0 flex-1 flex-col gap-1"
    >
      <div className="flex gap-1.5">
        {sections.map((section, i) => {
          const fill =
            i < run.section
              ? 1
              : i > run.section
                ? 0
                : (run.item + feedbackDone) / Math.max(1, section.items.length);
          return (
            <div
              key={section.kind}
              className={`h-4 min-w-0 overflow-hidden rounded-full border-3 border-ink bg-white ${i === run.section ? 'flex-[1.7]' : 'flex-1'}`}
            >
              <div
                className={`h-full transition-[width] duration-300 ${i < run.section ? 'bg-leaf' : 'bg-sun'}`}
                style={{ width: `${fill * 100}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between gap-1 text-xs leading-none font-extrabold text-ink-soft">
        {sections.map((section, i) => (
          <span
            key={section.kind}
            className={`min-w-0 truncate text-center ${i === run.section ? 'flex-[1.7] text-ink' : 'flex-1'}`}
          >
            {practice ? 'Practice' : STEP[section.kind].name}
            {i < run.section
              ? ''
              : i === run.section
                ? ` ${Math.min(run.item + 1, section.items.length)}/${section.items.length}`
                : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function Header({ run }: { run: QuestRun }) {
  const { actions } = useGame();
  return (
    <header className="flex items-center gap-2">
      <IconButton icon="home" label="Home" aria-label="home" onClick={actions.goHome} />
      <StepBar run={run} />
      <IconButton icon="speaker" label="Again" aria-label="say it again" onClick={actions.replay} />
    </header>
  );
}

/** The card that opens each step: which step, what it is, and what comes after. */
function StepIntro({ run, section }: { run: QuestRun; section: QuestSection }) {
  const { actions } = useGame();
  const sections = run.quest.sections;
  const step = STEP[section.kind];
  return (
    <main className="screen" data-stage="section-intro">
      <Header run={run} />
      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto text-center">
        <p className="section-label mt-2">
          Step {run.section + 1} of {sections.length}
        </p>
        <span className="pop flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-ink bg-[#fff3c4]">
          <Icon name={step.icon} size={76} />
        </span>
        <h1 className="text-4xl font-black">{step.name}</h1>
        <p className="text-lg font-bold text-ink-soft">{about(section, run)}</p>
        <ol className="card flex w-full max-w-md flex-col gap-1 !p-2 text-left">
          {sections.map((s, i) => (
            <li
              key={s.kind}
              className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-base font-extrabold ${i === run.section ? 'bg-[#fff3c4]' : ''}`}
            >
              <Icon name={i < run.section ? 'done' : STEP[s.kind].icon} size={28} />
              <span className="flex-1">{STEP[s.kind].name}</span>
              <span className="text-sm text-ink-soft">
                {i < run.section
                  ? 'done'
                  : i === run.section
                    ? 'now'
                    : s.optional
                      ? 'if you want'
                      : 'next'}
              </span>
            </li>
          ))}
        </ol>
        <BearSays mood="happy" size={72} className="mt-auto" />
      </div>
      <BigButton
        label="Let's go"
        icon="arrow"
        iconAfter
        className="w-full text-3xl"
        onClick={actions.beginSection}
      />
    </main>
  );
}

/** After the steps that count: the day is already won, so the bonus is truly optional. */
function BonusOffer({ run }: { run: QuestRun }) {
  const { actions } = useGame();
  return (
    <main className="screen" data-stage="offer-challenge">
      <Header run={run} />
      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto text-center">
        <p className="flex w-full max-w-md items-center gap-2 rounded-2xl border-3 border-ink bg-leaf px-3 py-2 text-left text-base font-extrabold">
          <Icon name="done" size={32} />
          Today's quest is done. Your plant grew!
        </p>
        <section className="card flex w-full max-w-md flex-col items-center gap-1 !py-4">
          <Icon name="star" size={80} />
          <h1 className="text-3xl font-black">Bonus round?</h1>
          <p className="text-lg font-bold text-ink-soft">
            {run.quest.sections.find((s) => s.kind === 'challenge')?.items.length ?? 3} trickier
            ones, just for fun
          </p>
          <p className="flex items-center gap-1.5 text-xl font-black">
            <Icon name="coin" size={28} />+{COINS.challengeComplete} bonus coins
          </p>
        </section>
        <BearSays mood="happy" size={72} className="mt-auto" />
      </div>
      <div className="flex w-full gap-3">
        <BigButton
          label="I'm done"
          tone="quiet"
          className="flex-1"
          onClick={actions.skipChallenge}
        />
        <BigButton
          label="Try it"
          icon="play"
          className="flex-1"
          onClick={actions.acceptChallenge}
        />
      </div>
    </main>
  );
}

export function Quest() {
  const { actions, use, audioOk, sayDigit } = useGame();
  const run = use((s) => s.run);
  const feedback = use((s) => s.feedback);
  const tried = use((s) => s.triedValues);
  const mood = use((s) => s.mood);
  if (!run) return null;
  const section = currentSection(run);
  const item = currentItem(run);

  if (run.stage === 'section-intro' && section) return <StepIntro run={run} section={section} />;
  if (run.stage === 'offer-challenge') return <BonusOffer run={run} />;

  if (!item || !section) return null;
  const worked = run.stage === 'worked-example';
  const showAnswer = worked || feedback?.kind === 'reveal';
  const help = showAnswer ? 'reveal' : run.misses > 0 ? 'hint' : 'none';
  const correct = feedback?.kind === 'correct';

  return (
    <main
      className="screen relative"
      data-section={run.section}
      data-item={run.item}
      data-stage={run.stage}
    >
      <h1 className="sr-only">Daily quest</h1>
      <Header run={run} />
      {correct && (
        <p
          data-testid="correct"
          className="pop absolute top-24 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-2xl border-3 border-ink bg-leaf px-4 py-1.5 text-2xl font-black shadow-[0_4px_0_var(--color-ink)]"
        >
          <Icon name="check" size={26} />
          Yes!
          <Icon name="coin" size={26} />+{feedback.coins}
        </p>
      )}
      <div className="quest-caption flex items-center gap-2">
        <MyMascot mood={mood} size={44} />
        <CaptionLine />
      </div>
      {worked && (
        <p className="section-label -mt-1 text-center" data-testid="worked">
          Watch how this one works
        </p>
      )}
      {run.misses > 0 && !showAnswer && (
        <div data-testid="not-yet" className="sr-only">
          not yet
        </div>
      )}
      <ProblemView
        key={`${run.section}.${run.item}.${run.finalReplayed}`}
        problem={item.problem}
        audioOk={audioOk}
        onAnswer={actions.answer}
        onDigit={sayDigit}
        tried={tried}
        help={help}
        locked={run.stage !== 'answering'}
        footer={
          showAnswer ? (
            <BigButton
              label="Next"
              aria-label="next"
              icon="arrow"
              iconAfter
              onClick={worked ? actions.finishWorked : actions.next}
              className="w-full"
            />
          ) : undefined
        }
      />
    </main>
  );
}

/** The bear's latest words, in one or two lines beside it. */
function CaptionLine() {
  const { use } = useGame();
  const caption = use((s) => s.caption);
  if (!caption) return null;
  let text: string;
  try {
    text = render(caption.key, caption.params);
  } catch {
    return null;
  }
  return (
    <p
      data-testid="caption"
      aria-live="polite"
      className="bubble bubble-left line-clamp-2 flex-1 !py-1 text-base"
    >
      {text}
    </p>
  );
}
