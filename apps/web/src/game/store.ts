import { GRADE_1_SKILLS, answerSpeech, render } from '@mathapp/content';
import {
  acceptChallenge,
  advance,
  applyPlacement,
  beginSection,
  buildDailyQuest,
  classifyError,
  completeDailyQuest,
  currentItem,
  currentSection,
  earnCoins,
  finishWorkedExample,
  hashSeed,
  isCorrect,
  nextProbe,
  placementRng,
  reconcileStreak,
  recordProbe,
  refreshUnlocks,
  resumeRun,
  settleItem,
  skipChallenge,
  startPlacement,
  startRun,
  submitAnswer,
  COINS,
  type Attempt,
  type ChildProfile,
  type PlacementState,
  type Problem,
  type QuestRun,
  type Rng,
  type Session,
  type Speech,
  type StreakEvent,
  type TryResult,
} from '@mathapp/engine';
import { createStore } from 'zustand/vanilla';
import type { PlaySound } from '../audio/sfx';
import type { Speaker } from '../audio/speech';
import type {
  ChildProgress,
  ProgressChange,
  ProgressRepository,
} from '../db/repositories/progress';
import type { NewChild, childrenRepository } from '../db/repositories/children';
import { localDate } from './today';

export type Screen = 'loading' | 'setup' | 'placement' | 'home' | 'quest' | 'celebrate';
export type Mood = 'idle' | 'happy' | 'thinking' | 'cheer';

/** A correct answer holds on screen this long, so the rhythm stays quick. */
const WARMUP_BEAT_MS = 450;
const CORRECT_BEAT_MS = 800;
const PLACEMENT_BEAT_MS = 400;
const PRAISE_EVERY = 3;

export interface GameDeps {
  children: ReturnType<typeof childrenRepository>;
  progress: ProgressRepository;
  speaker: Speaker;
  play: PlaySound;
  now: () => number;
  /** Replaced in tests so nothing waits on real time. */
  after: (ms: number, run: () => void) => void;
}

export interface GameState {
  screen: Screen;
  child?: ChildProfile;
  /** The day this data was loaded for. */
  enteredOn?: string;
  progress?: ChildProgress;
  session?: Session;
  run?: QuestRun;
  feedback?: TryResult;
  /** Choices already tried on this problem, shown as used. */
  triedValues: string[];
  mood: Mood;
  todayDone: boolean;
  /** Speech from settling missed days, said once on the home screen. */
  homeNote?: Speech;
  celebration: Speech[];
  placement?: { state: PlacementState; problem: Problem; asked: number };
}

export function createGame(deps: GameDeps) {
  const { speaker, play, now, after, progress: repo, children } = deps;
  const store = createStore<GameState>(() => ({
    screen: 'loading',
    triedValues: [],
    mood: 'idle',
    todayDone: false,
    celebration: [],
  }));
  const get = store.getState;
  const set = store.setState;

  /** Saves run in order, off the tap path, so feedback never waits on storage. */
  let writes: Promise<void> = Promise.resolve();
  const save = (change: ProgressChange) => {
    writes = writes.then(() => repo.save(change)).catch((error) => console.error(error));
  };

  /** The response clock starts when the prompt finishes, so listening isn't counted. */
  let shownAt = 0;
  let speechEndedAt: number | undefined;
  let placementRngFor: Rng | undefined;

  const today = () => localDate(new Date(now()));
  const need = <T>(value: T | undefined): T => {
    if (value === undefined) throw new Error('Game state missing');
    return value;
  };

  function prompt(line: Speech) {
    shownAt = now();
    speechEndedAt = undefined;
    speaker.say(line, () => {
      speechEndedAt = now();
    });
  }

  const responseMs = (stoppedAt: number) =>
    Math.max(
      0,
      stoppedAt - (speechEndedAt !== undefined ? Math.min(speechEndedAt, stoppedAt) : shownAt),
    );

  function updateRun(run: QuestRun, change: ProgressChange = {}) {
    const session = need(get().session);
    const next: Session = {
      ...session,
      run,
      coinsEarned: run.coins,
      problemsCount: run.answered,
      correctCount: run.correct,
      updatedAt: now(),
    };
    set({ run, session: next });
    save({ ...change, session: next });
  }

  function present(run: QuestRun) {
    const item = currentItem(run);
    set({ feedback: undefined, triedValues: [], mood: 'idle' });
    if (run.stage === 'section-intro') {
      const kind = currentSection(run)?.kind;
      speaker.say({
        key:
          kind === 'warmup'
            ? 'quest.warmup'
            : kind === 'skill'
              ? 'quest.skill'
              : 'quest.challenge-start',
      });
    } else if (run.stage === 'offer-challenge') {
      speaker.say({ key: 'quest.challenge' });
    } else if (run.stage === 'worked-example' && item) {
      const { problem } = item;
      speaker.say(problem.speech, () => speaker.say(answerSpeech(problem)));
    } else if (run.stage === 'answering' && item) {
      prompt(item.problem.speech);
    } else if (run.stage === 'finished') {
      celebrate(run);
    }
  }

  function celebrate(run: QuestRun, skipped = false) {
    const session = need(get().session);
    const roughDay = run.answered > 0 && run.correct / run.answered < 0.5;
    const ended: Session = {
      ...session,
      endedAt: now(),
      problemsCount: run.answered,
      correctCount: run.correct,
      coinsEarned: run.coins,
      updatedAt: now(),
    };
    delete ended.run;
    save({ session: ended });
    const lines: Speech[] = [
      ...(skipped ? [{ key: 'quest.challenge-skip' }] : []),
      { key: 'quest.coins', params: { coins: run.coins } },
      ...get().celebration,
      { key: roughDay ? 'quest.rough-day' : 'quest.done' },
    ];
    set({ session: ended, screen: 'celebrate', mood: 'cheer', todayDone: true });
    play('cheer');
    sayInOrder(lines);
  }

  function sayInOrder(lines: Speech[]) {
    const [first, ...rest] = lines;
    if (first) speaker.say(first, () => sayInOrder(rest));
  }

  const eventLine = (event: StreakEvent): Speech | undefined => {
    switch (event.type) {
      case 'first-day':
        return { key: 'streak.first' };
      case 'grew':
        return { key: 'streak.grew' };
      case 'milestone':
        return { key: 'streak.milestone', params: { days: event.days } };
      case 'shield-earned':
        return { key: 'streak.shield-earned' };
      case 'perfect-week':
        return { key: 'streak.perfect-week' };
      case 'new-streak':
        return event.best > 0 ? { key: 'streak.new', params: { best: event.best } } : undefined;
      case 'shielded':
        return { key: 'streak.shielded' };
    }
  };

  /** Runs once, the moment the required sections are done, before any challenge. */
  function completeIfDone(run: QuestRun, before: QuestRun): ProgressChange {
    const state = get();
    if (!run.questDone || before.questDone) return {};
    const data = need(state.progress);
    const done = completeDailyQuest({
      child: need(state.child),
      streak: data.streak,
      wallet: data.wallet,
      states: data.states,
      quest: run.quest,
      at: now(),
    });
    set({
      child: done.child,
      progress: { ...data, streak: done.streak, wallet: done.wallet, states: done.states },
      celebration: done.events.map(eventLine).filter((l): l is Speech => l !== undefined),
    });
    const session = need(get().session);
    set({ session: { ...session, completedQuest: true } });
    const todaySkill = done.states[run.quest.todaySkillId];
    return {
      child: done.child,
      streak: done.streak,
      wallet: done.wallet,
      skills: todaySkill ? [todaySkill] : [],
    };
  }

  function move(next: QuestRun, before: QuestRun) {
    const change = completeIfDone(next, before);
    if (next.challengeDone && !before.challengeDone) {
      const data = need(get().progress);
      const wallet = earnCoins(data.wallet, COINS.challengeComplete, now());
      set({ progress: { ...data, wallet } });
      change.wallet = wallet;
    }
    updateRun(next, change);
    present(next);
  }

  function attemptRow(
    problem: Problem,
    given: string,
    ms: number,
    tryNumber: 1 | 2,
    correct: boolean,
  ): Attempt {
    const state = get();
    const row: Attempt = {
      id: crypto.randomUUID(),
      childId: need(state.child).id,
      sessionId: need(state.session).id,
      skillId: problem.skillId,
      questionType: problem.questionType,
      difficulty: problem.difficulty,
      prompt: render(problem.speech.key, problem.speech.params),
      answer: problem.answer,
      given,
      correct,
      tryNumber,
      responseMs: ms,
      at: now(),
      updatedAt: now(),
    };
    if (!correct) row.errorType = classifyError(problem, given);
    return row;
  }

  function settle(
    run: QuestRun,
    problem: Problem,
    outcome: NonNullable<QuestRun['lastOutcome']>,
    ms: number,
    coins: number,
  ) {
    const state = get();
    const data = need(state.progress);
    const child = need(state.child);
    const at = now();
    const { states, card } = settleItem({
      skills: GRADE_1_SKILLS,
      states: data.states,
      card: problem.factId ? data.cards.get(problem.factId) : undefined,
      childId: child.id,
      problem,
      outcome,
      errorType: run.firstError,
      responseMs: ms,
      today: run.quest.date,
      at,
    });
    const wallet = coins > 0 ? earnCoins(data.wallet, coins, at) : data.wallet;
    const cards = new Map(data.cards);
    if (card) cards.set(card.factId, card);
    set({ progress: { ...data, states, cards, wallet } });
    const skills = Object.values(states).filter((s) => s !== undefined && s.updatedAt === at);
    return { skills: skills as NonNullable<ProgressChange['skills']>, card, wallet };
  }

  const fastMsFor = (problem: Problem) =>
    GRADE_1_SKILLS.find((s) => s.id === problem.skillId)?.fastMs ?? 3000;

  const actions = {
    async open() {
      const [first] = await children.list();
      if (!first) {
        set({ screen: 'setup' });
        return;
      }
      await actions.enter(first);
    },

    async createChild(input: NewChild) {
      await actions.enter(await children.create(input));
    },

    /** Loads a child and settles any missed days. Safe to repeat. */
    async enter(child: ChildProfile) {
      const data = await repo.load(child.id);
      const at = now();
      const date = today();
      const settled = reconcileStreak(data.streak, date, at);
      const states = refreshUnlocks(GRADE_1_SKILLS, data.states, child.id, at);
      const sessions = await repo.sessionsOn(child.id, date);
      const note = settled.events.map(eventLine).find((l) => l !== undefined);
      const session = sessions.find((s) => s.type === 'quest' && s.run);
      set({
        child,
        enteredOn: date,
        session: undefined,
        run: undefined,
        progress: { ...data, states, streak: settled.streak },
        todayDone: sessions.some((s) => s.type === 'quest' && s.completedQuest && !s.run),
        screen: child.placedAt === undefined ? 'placement' : 'home',
        ...(session ? { session, run: session.run } : {}),
        ...(note ? { homeNote: note } : {}),
      });
      if (settled.streak !== data.streak) save({ streak: settled.streak });
    },

    /** The first tap: iOS allows speech and sound only after this. */
    unlockAudio() {
      speaker.unlock();
      play('tap');
    },

    sayHome() {
      const { homeNote, todayDone, run } = get();
      const key = todayDone ? 'home.done' : run ? 'home.resume' : 'home.start';
      sayInOrder([...(homeNote ? [homeNote] : []), { key }]);
      set({ homeNote: undefined, mood: 'idle' });
    },

    sayPlacementIntro() {
      if (!get().placement) speaker.say({ key: 'placement.intro' });
    },

    /** Number-pad keys speak too, so the child hears each digit they enter. */
    sayDigit(digit: string) {
      play('tap');
      speaker.say({ key: 'digit', params: { digit } });
    },

    startPlacement() {
      const child = need(get().child);
      actions.unlockAudio();
      placementRngFor = placementRng(hashSeed(child.id));
      const state = startPlacement();
      const problem = need(nextProbe(state, placementRngFor));
      const at = now();
      const session: Session = {
        id: crypto.randomUUID(),
        childId: child.id,
        startedAt: at,
        date: today(),
        type: 'placement',
        problemsCount: 0,
        correctCount: 0,
        coinsEarned: 0,
        completedQuest: false,
        updatedAt: at,
      };
      set({
        session,
        placement: { state, problem, asked: 0 },
        triedValues: [],
        feedback: undefined,
      });
      save({ session });
      prompt(problem.speech);
    },

    answerPlacement(given: string, stoppedAt = now()) {
      const { placement, session } = get();
      if (!placement || !session || get().mood === 'happy') return;
      const correct = isCorrect(placement.problem, given);
      const state = recordProbe(placement.state, correct);
      const attempt = attemptRow(placement.problem, given, responseMs(stoppedAt), 1, correct);
      const updated: Session = {
        ...session,
        problemsCount: session.problemsCount + 1,
        correctCount: session.correctCount + (correct ? 1 : 0),
        updatedAt: now(),
      };
      // The same soft response either way: placement is finding a level, not grading.
      play('tap');
      set({ session: updated, mood: 'happy' });
      save({ session: updated, attempt });
      speaker.say({ key: 'placement.next' });
      after(PLACEMENT_BEAT_MS, () => {
        const problem = nextProbe(state, need(placementRngFor));
        if (problem) {
          set({ placement: { state, problem, asked: placement.asked + 1 }, mood: 'idle' });
          prompt(problem.speech);
          return;
        }
        actions.finishPlacement(state);
      });
    },

    finishPlacement(state: PlacementState) {
      const current = get();
      const child = need(current.child);
      const data = need(current.progress);
      const at = now();
      const states = applyPlacement(state.passed, GRADE_1_SKILLS, data.states, child.id, at);
      const placed: ChildProfile = { ...child, placedAt: at, updatedAt: at };
      const session = { ...need(current.session), endedAt: at, updatedAt: at };
      const skills = Object.values(states).filter((s) => s !== undefined);
      save({ child: placed, session, skills: skills as NonNullable<ProgressChange['skills']> });
      set({
        child: placed,
        progress: { ...data, states },
        placement: undefined,
        session: undefined,
        screen: 'home',
        mood: 'idle',
        // Home speaks when it opens, so this goes first instead of being cut off by it.
        homeNote: { key: 'placement.done' },
      });
    },

    startQuest() {
      actions.unlockAudio();
      const state = get();
      if (state.todayDone) return;
      if (state.run && state.session) {
        const run = resumeRun(state.run);
        set({ screen: 'quest' });
        updateRun(run);
        present(run);
        return;
      }
      const child = need(state.child);
      const data = need(state.progress);
      const date = today();
      const quest = buildDailyQuest({
        childId: child.id,
        today: date,
        questsCompleted: child.questsCompleted,
        skills: GRADE_1_SKILLS,
        states: data.states,
        factCards: [...data.cards.values()],
      });
      const run = startRun(quest);
      const at = now();
      const session: Session = {
        id: crypto.randomUUID(),
        childId: child.id,
        startedAt: at,
        date,
        type: 'quest',
        problemsCount: 0,
        correctCount: 0,
        coinsEarned: 0,
        completedQuest: false,
        run,
        updatedAt: at,
      };
      set({ session, run, screen: 'quest', celebration: [] });
      save({ session });
      present(run);
    },

    beginSection() {
      const run = need(get().run);
      play('tap');
      const next = beginSection(run);
      updateRun(next);
      present(next);
    },

    finishWorked() {
      const run = need(get().run);
      play('tap');
      move(finishWorkedExample(run), run);
    },

    /** `stoppedAt` lets the number pad stop the clock at the last digit, not the check mark. */
    answer(given: string, stoppedAt = now()) {
      const run = get().run;
      const item = run && currentItem(run);
      if (!run || !item) return;
      const { problem } = item;
      const ms = responseMs(stoppedAt);
      const tried = submitAnswer(run, { given, responseMs: ms, fastMs: fastMsFor(problem) });
      if (!tried) return;
      const { run: next, result } = tried;
      const attempt = attemptRow(problem, given, ms, result.tryNumber, result.kind === 'correct');

      // Everything the child sees and hears happens before any storage work.
      if (result.kind === 'retry') {
        set({ feedback: result, mood: 'thinking', triedValues: [...get().triedValues, given] });
        play('not-yet');
        updateRun(next, { attempt });
        prompt({ key: 'feedback.retry' });
        return;
      }
      if (result.kind === 'reveal') {
        set({ feedback: result, mood: 'thinking', triedValues: [...get().triedValues, given] });
        play('not-yet');
        const scored = settle(next, problem, 'missed', ms, 0);
        updateRun(next, { attempt, ...scored });
        speaker.say({ key: 'feedback.show-answer' }, () => speaker.say(answerSpeech(problem)));
        return;
      }

      set({ feedback: result, mood: 'happy' });
      play('correct');
      const scored = settle(next, problem, result.outcome, ms, result.coins);
      updateRun(next, { attempt, ...scored });
      const go = () => actions.next();
      if (result.tryNumber === 2) {
        speaker.say({ key: 'feedback.recovered' }, go);
      } else if (next.inARow % PRAISE_EVERY === 0) {
        speaker.say({ key: `feedback.correct.${(next.inARow / PRAISE_EVERY) % 3 || 3}` }, go);
      } else {
        speaker.stop();
        after(currentSection(next)?.kind === 'warmup' ? WARMUP_BEAT_MS : CORRECT_BEAT_MS, go);
      }
    },

    /** After feedback. Safe to call twice: the second call finds nothing to do. */
    next() {
      const { run, screen } = get();
      // Left for home during the pause: the quest resumes from here next time.
      if (!run || run.stage !== 'feedback' || screen !== 'quest') return;
      move(advance(run), run);
    },

    acceptChallenge() {
      const run = need(get().run);
      play('tap');
      move(acceptChallenge(run), run);
    },

    skipChallenge() {
      const run = need(get().run);
      play('tap');
      const next = skipChallenge(run);
      updateRun(next);
      set({ feedback: undefined });
      celebrate(next, true);
    },

    replay() {
      const { run, placement } = get();
      const item = run && currentItem(run);
      if (placement) speaker.say(placement.problem.speech);
      else if (run?.stage === 'answering' && item) speaker.say(item.problem.speech);
      else if (run?.stage === 'worked-example' && item) speaker.say(item.problem.speech);
      else if (run?.stage === 'offer-challenge') speaker.say({ key: 'quest.challenge' });
    },

    /** Leaving is free: the quest stays exactly where it is for later. */
    goHome() {
      speaker.stop();
      const finished = get().run?.stage === 'finished';
      set({ screen: 'home', feedback: undefined, ...(finished ? { run: undefined } : {}) });
    },

    /** An installed app can sit in memory overnight, so a new day must be noticed on return. */
    async checkNewDay() {
      const { child, screen, enteredOn } = get();
      if (!child || enteredOn === today()) return;
      if (screen !== 'home' && screen !== 'celebrate') return;
      await actions.enter(child);
      // From the celebration, opening Home does the speaking.
      if (screen === 'home') actions.sayHome();
    },

    /** Lets tests wait until everything has reached the database. */
    flushed: () => writes,
  };

  return { store, actions };
}

export type Game = ReturnType<typeof createGame>;
