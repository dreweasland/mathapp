import {
  COLLECTIBLE_SETS,
  FIRST_ACCESSORY,
  ALL_SKILLS,
  answerSpeech,
  cosmeticFor,
  render,
  skillById,
} from '@mathapp/content';
import {
  BLITZ_MS,
  MISSION_COINS,
  acceptChallenge,
  advance,
  advanceGoals,
  allMissionsDone,
  applyMissionEvent,
  applyPlacement,
  bankMissionChest,
  bankQuestChests,
  beatsFastTime,
  beginSection,
  buildDailyQuest,
  buildPractice,
  buyCosmetic,
  classifyError,
  coinsForAnswer,
  completeDailyQuest,
  currentItem,
  currentSection,
  earnCoins,
  finishWorkedExample,
  generateMissions,
  hashSeed,
  isCorrect,
  justReached,
  mulberry32,
  newSkillState,
  nextBlitzProblem,
  nextProbe,
  openNextChest,
  placementRng,
  reconcileStreak,
  recordBlitz,
  recordProbe,
  refreshUnlocks,
  resumeRun,
  selectToday,
  settleItem,
  skipChallenge,
  startAtGrade,
  startPlacement,
  startRun,
  submitAnswer,
  toggleCosmetic,
  COINS,
  type Attempt,
  type ChestReward,
  type ChildProfile,
  type Goal,
  type Mission,
  type MissionEvent,
  type PlacementState,
  type Problem,
  type QuestRun,
  type Rng,
  type Session,
  type SkillState,
  type Speech,
  type StreakEvent,
  type TryResult,
} from '@mathapp/engine';
import { createStore } from 'zustand/vanilla';
import type { ClipPlayer } from '../audio/clip';
import type { PlaySound } from '../audio/sfx';
import type { Speaker } from '../audio/speech';
import type { StoredCheer } from '../db/db';
import { backupDue, type FamilyRepository } from '../db/repositories/family';
import type {
  ChildProgress,
  ProgressChange,
  ProgressRepository,
} from '../db/repositories/progress';
import type { NewChild, childrenRepository } from '../db/repositories/children';
import { localDate } from './today';

export type Screen =
  | 'loading'
  | 'setup'
  | 'who'
  | 'parent'
  | 'placement'
  | 'home'
  | 'cheer'
  | 'blitz'
  | 'free-done'
  | 'quest'
  | 'celebrate'
  | 'map'
  | 'trophies'
  | 'stickers'
  | 'shop'
  | 'free';

const PLACE_LINE = {
  map: 'nav.map',
  trophies: 'nav.trophies',
  stickers: 'nav.stickers',
  shop: 'nav.shop',
  free: 'nav.free',
} as const;
export type Place = keyof typeof PLACE_LINE;
export type Mood = 'idle' | 'happy' | 'thinking' | 'cheer';

/** A correct answer holds on screen this long, so the rhythm stays quick. */
const WARMUP_BEAT_MS = 450;
const CORRECT_BEAT_MS = 800;
const PLACEMENT_BEAT_MS = 400;
const PRAISE_EVERY = 3;

export interface GameDeps {
  children: ReturnType<typeof childrenRepository>;
  progress: ProgressRepository;
  family: FamilyRepository;
  speaker: Speaker;
  play: PlaySound;
  clip: ClipPlayer;
  now: () => number;
  /** Replaced in tests so nothing waits on real time. */
  after: (ms: number, run: () => void) => void;
}

export interface BlitzRun {
  id: string;
  skillId: string;
  problem: Problem;
  score: number;
  coins: number;
}

export interface GameState {
  screen: Screen;
  child?: ChildProfile;
  /** Everyone on this device, for "who's playing?". */
  everyone: ChildProfile[];
  /** A grown-up should save a backup: this device holds the only copy. */
  backupDue: boolean;
  /** The cheer on screen now. */
  cheer?: StoredCheer;
  /** A Fact Blitz in progress. */
  blitz?: BlitzRun;
  /** What the last free-play set earned, for its small ending screen. */
  freeResult?: { coins: number; score?: number; best?: number; isBest?: boolean };
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
  missions: Mission[];
  /** Badges earned in this quest, for the celebration. */
  newBadges: string[];
  /** Said when the celebration ends: warm on a rough day too. */
  farewell?: Speech;
  /** The chest being shown right now. */
  openedChest?: ChestReward;
  /** A save failed, so a grown-up should know progress may not be stored. */
  saveFailed: boolean;
  placement?: { state: PlacementState; problem: Problem; asked: number };
}

export function createGame(deps: GameDeps) {
  const { speaker, play, clip, now, after, progress: repo, children, family } = deps;
  const store = createStore<GameState>(() => ({
    screen: 'loading',
    everyone: [],
    backupDue: false,
    triedValues: [],
    mood: 'idle',
    todayDone: false,
    celebration: [],
    missions: [],
    newBadges: [],
    saveFailed: false,
  }));
  const get = store.getState;
  const set = store.setState;

  /** Saves run in order, off the tap path, so feedback never waits on storage. */
  let writes: Promise<void> = Promise.resolve();
  const save = (change: ProgressChange) => {
    writes = writes
      .then(() => repo.save(change))
      .catch((error) => {
        console.error(error);
        set({ saveFailed: true });
      });
  };

  /** The response clock starts when the prompt finishes, so listening isn't counted. */
  let shownAt = 0;
  let speechEndedAt: number | undefined;
  let placementRngFor: Rng | undefined;
  let blitzRng: Rng | undefined;

  const today = () => localDate(new Date(now()));
  const newSession = (
    childId: string,
    type: Session['type'],
    at: number,
    run?: QuestRun,
  ): Session => ({
    id: crypto.randomUUID(),
    childId,
    startedAt: at,
    date: today(),
    type,
    problemsCount: 0,
    correctCount: 0,
    coinsEarned: 0,
    completedQuest: false,
    updatedAt: at,
    ...(run ? { run } : {}),
  });
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

  const challengeOffer = (): Speech => ({
    key: get().child?.dailyGoal === 'quest+challenge' ? 'quest.challenge-goal' : 'quest.challenge',
  });

  /** Moves the grown-up's real-world goals, and says so if one was just reached. */
  function moveGoals(unit: Goal['unit'], date: string): ProgressChange {
    const data = need(get().progress);
    const goals = advanceGoals(data.goals, unit, 1, date, now());
    if (goals === data.goals) return {};
    const reached = justReached(data.goals, goals).map((g) => ({
      key: 'goal.reached',
      params: { reward: g.rewardText },
    }));
    set({
      progress: { ...data, goals },
      celebration: [...get().celebration, ...reached],
    });
    return { goals };
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
      speaker.say(challengeOffer());
    } else if (run.stage === 'worked-example' && item) {
      const { problem } = item;
      speaker.say(problem.speech, () => speaker.say(answerSpeech(problem)));
    } else if (run.stage === 'answering' && item) {
      prompt(item.problem.speech);
    } else if (run.stage === 'finished') {
      celebrate(run);
    }
  }

  /** Free play ends small: a coin count and the way home, with no chest and no streak. */
  function endFreeSession(result: GameState['freeResult'], line: Speech) {
    const session = need(get().session);
    const ended: Session = { ...session, endedAt: now(), updatedAt: now() };
    delete ended.run;
    save({ session: ended });
    set({ session: undefined, run: undefined, blitz: undefined, freeResult: result });
    set({ screen: 'free-done', mood: 'cheer', feedback: undefined });
    play('cheer');
    speaker.say(line);
  }

  function celebrate(run: QuestRun, skipped = false) {
    if (run.quest.free) {
      endFreeSession({ coins: run.coins }, { key: 'free.done', params: { coins: run.coins } });
      return;
    }
    const session = need(get().session);
    const roughDay = run.answered > 0 && run.correct / run.answered < 0.5;
    const ended: Session = {
      ...session,
      endedAt: now(),
      problemsCount: run.answered,
      correctCount: run.correct,
      coinsEarned: run.coins,
      challengeDone: run.challengeDone,
      updatedAt: now(),
    };
    delete ended.run;
    save({ session: ended });
    const farewell: Speech = { key: roughDay ? 'quest.rough-day' : 'quest.done' };
    const lines: Speech[] = [
      ...(skipped ? [{ key: 'quest.challenge-skip' }] : []),
      { key: 'quest.coins', params: { coins: run.coins } },
      ...get().celebration,
      ...get().newBadges.map((id) => ({
        key: 'badge.earned',
        params: { badge: render(`badge.${id}`) },
      })),
      ...(allMissionsDone(get().missions) ? [{ key: 'mission.all-done' }] : []),
      ...(run.challengeDone && get().child?.dailyGoal === 'quest+challenge'
        ? [{ key: 'daily.met' }]
        : []),
      // With a chest waiting, the goodbye comes after it's open.
      get().progress?.inventory.unopened.length ? { key: 'chest.tap' } : farewell,
    ];
    set({ session: ended, screen: 'celebrate', mood: 'cheer', todayDone: true, farewell });
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
    const bank = bankQuestChests({
      streak: done.streak,
      wallet: done.wallet,
      inventory: data.inventory,
      childId: done.child.id,
      date: run.quest.date,
      dayNumber: run.quest.dayNumber,
      events: done.events,
      sets: COLLECTIBLE_SETS,
      firstAccessory: FIRST_ACCESSORY,
      at: now(),
    });
    set({
      child: done.child,
      progress: { ...data, ...bank, states: done.states },
      celebration: [
        ...state.celebration,
        ...done.events.map(eventLine).filter((l): l is Speech => l !== undefined),
      ],
      session: { ...need(state.session), completedQuest: true },
    });
    const goals = {
      ...moveGoals('quests', run.quest.date),
      ...(done.events.some((e) => e.type === 'perfect-week')
        ? moveGoals('perfect-weeks', run.quest.date)
        : {}),
    };
    const todaySkill = done.states[run.quest.todaySkillId];
    return { child: done.child, skills: todaySkill ? [todaySkill] : [], ...goals };
  }

  /** Advances missions, pays any just finished, and banks the bonus chest for all three. */
  function advanceMissions(events: MissionEvent[]): { change: ProgressChange; coins: number } {
    const before = get().missions;
    const at = now();
    const next = events.reduce((list, event) => applyMissionEvent(list, event, at), before);
    if (next === before || next.every((m, i) => m === before[i])) return { change: {}, coins: 0 };
    const finished = next.filter((m, i) => m.done && !before[i]?.done);
    const coins = finished.reduce((sum, m) => sum + MISSION_COINS[m.slot], 0);
    const data = need(get().progress);
    const wallet = coins > 0 ? earnCoins(data.wallet, coins, at) : data.wallet;
    const bank =
      finished.length > 0 && allMissionsDone(next)
        ? bankMissionChest(
            { streak: data.streak, wallet, inventory: data.inventory },
            {
              childId: need(get().child).id,
              date: need(next[0]).date,
              dayNumber: need(get().child).questsCompleted + 1,
              sets: COLLECTIBLE_SETS,
              at,
            },
          )
        : { streak: data.streak, wallet, inventory: data.inventory };
    set({ missions: next, progress: { ...data, ...bank } });
    return { change: { missions: next }, coins };
  }

  /** What money and chests look like right now, so a save always has the latest. */
  const rewardRows = (): ProgressChange => {
    const { wallet, streak, inventory } = need(get().progress);
    return { wallet, streak, inventory };
  };

  function ensureMissions(date: string) {
    const { child, progress: data } = get();
    if (!child || !data || get().missions.length > 0) return;
    const today = selectToday(ALL_SKILLS, data.states, child.questsCompleted);
    const missions = generateMissions(
      {
        childId: child.id,
        date,
        todayMastery: data.states[today?.skill.id ?? '']?.mastery ?? 0,
        factCards: [...data.cards.values()],
        at: now(),
      },
      mulberry32(hashSeed(`${child.id}|${date}|missions`)),
    );
    set({ missions });
    save({ missions });
  }

  function move(next: QuestRun, before: QuestRun) {
    const change = completeIfDone(next, before);
    const events: MissionEvent[] = [];
    if (next.questDone && !before.questDone) events.push({ type: 'quest-complete' });
    if (next.challengeDone && !before.challengeDone) {
      const data = need(get().progress);
      const wallet = earnCoins(data.wallet, COINS.challengeComplete, now());
      set({ progress: { ...data, wallet } });
      events.push({ type: 'challenge-complete' });
    }
    const missions = advanceMissions(events);
    const run = { ...next, coins: next.coins + missions.coins };
    updateRun(run, { ...change, ...missions.change, ...(events.length ? rewardRows() : {}) });
    present(run);
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
    run: Pick<QuestRun, 'firstError'> & { date: string },
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
      skills: ALL_SKILLS,
      states: data.states,
      card: problem.factId ? data.cards.get(problem.factId) : undefined,
      childId: child.id,
      problem,
      outcome,
      errorType: run.firstError,
      responseMs: ms,
      today: run.date,
      at,
    });
    const wallet = coins > 0 ? earnCoins(data.wallet, coins, at) : data.wallet;
    const cards = new Map(data.cards);
    if (card) cards.set(card.factId, card);
    const earned =
      data.states[problem.skillId]?.masteredAt === undefined &&
      states[problem.skillId]?.masteredAt !== undefined;
    if (earned) set({ newBadges: [...state.newBadges, problem.skillId] });
    set({ progress: { ...data, states, cards, wallet } });
    const goals = earned ? moveGoals('skills', run.date) : {};
    const skills = Object.values(states).filter((s) => s !== undefined && s.updatedAt === at);
    return { skills: skills as NonNullable<ProgressChange['skills']>, card, wallet, ...goals };
  }

  const where = (run: QuestRun) => ({
    date: run.quest.date,
    ...(run.firstError ? { firstError: run.firstError } : {}),
  });

  const fastMsFor = (problem: Problem) =>
    ALL_SKILLS.find((s) => s.id === problem.skillId)?.fastMs ?? 3000;

  function beginQuest() {
    const state = get();
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
      skills: ALL_SKILLS,
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
    set({ session, run, screen: 'quest', celebration: [], newBadges: [] });
    save({ session });
    present(run);
  }

  const actions = {
    async open() {
      const everyone = await actions.loadEveryone();
      const [first] = everyone;
      if (!first) {
        set({ screen: 'setup' });
        return;
      }
      if (everyone.length > 1) set({ screen: 'who' });
      else await actions.enter(first);
    },

    async loadEveryone() {
      const everyone = (await children.list()).sort((a, b) => a.createdAt - b.createdAt);
      set({ everyone });
      return everyone;
    },

    /** Tapping your picture on Home: where brothers and sisters swap, and grown-ups come in. */
    async showWho() {
      play('tap');
      await actions.loadEveryone();
      set({ screen: 'who' });
      speaker.say({ key: 'who.pick' });
    },

    async pick(child: ChildProfile) {
      actions.unlockAudio();
      await writes;
      await actions.enter(child);
    },

    async openParent() {
      play('tap');
      speaker.say({ key: 'nav.grownups' });
      await writes;
      set({ screen: 'parent' });
    },

    /** The dashboard writes straight to storage, so everything here is read again. */
    async closeParent() {
      const everyone = await actions.loadEveryone();
      const current = everyone.find((c) => c.id === get().child?.id);
      if (!current) set({ child: undefined });
      if (current && everyone.length === 1) await actions.enter(current);
      else if (!current) await actions.open();
      else set({ screen: 'who' });
    },

    /** A child starting past Grade 1 skips the warm-up, which only covers Grade 1. */
    async createChild(input: NewChild) {
      const child = await children.create(input);
      if (child.grade === 1) {
        await actions.enter(child);
        return;
      }
      const at = now();
      const states = startAtGrade(child.grade, ALL_SKILLS, {}, child.id, at);
      const placed = { ...child, placedAt: at, updatedAt: at };
      await repo.save({
        child: placed,
        skills: Object.values(states).filter((s): s is SkillState => s !== undefined),
      });
      await actions.enter(placed);
    },

    /** Loads a child and settles any missed days. Safe to repeat. */
    async enter(child: ChildProfile) {
      const data = await repo.load(child.id);
      const at = now();
      const date = today();
      speaker.setVoice(child.settings.voice);
      const settled = reconcileStreak(data.streak, date, at);
      const states = refreshUnlocks(ALL_SKILLS, data.states, child.id, at);
      const sessions = await repo.sessionsOn(child.id, date);
      const note = settled.events.map(eventLine).find((l) => l !== undefined);
      const session = sessions.find((s) => s.type === 'quest' && s.run);
      const missions = await repo.missionsOn(child.id, date);
      const details = await family.get();
      set({
        child,
        enteredOn: date,
        missions,
        session: undefined,
        run: undefined,
        cheer: undefined,
        homeNote: undefined,
        backupDue: backupDue(details, child.questsCompleted, at),
        progress: { ...data, states, streak: settled.streak },
        todayDone: sessions.some((s) => s.type === 'quest' && s.completedQuest && !s.run),
        screen: child.placedAt === undefined ? 'placement' : 'home',
        ...(session ? { session, run: session.run } : {}),
        ...(note ? { homeNote: note } : {}),
      });
      if (settled.streak !== data.streak) save({ streak: settled.streak });
      // A grown-up's shield can finish a week from behind, when no quest is running.
      if (settled.events.some((e) => e.type === 'perfect-week')) {
        save(moveGoals('perfect-weeks', date));
      }
      if (child.placedAt !== undefined) ensureMissions(date);
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
      const states = applyPlacement(state.passed, ALL_SKILLS, data.states, child.id, at);
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
      ensureMissions(today());
    },

    startQuest() {
      actions.unlockAudio();
      const { todayDone, progress: data } = get();
      if (todayDone) return;
      const cheer = data?.cheers[0];
      if (!cheer) {
        beginQuest();
        return;
      }
      set({ cheer, screen: 'cheer', mood: 'cheer' });
      actions.playCheer();
    },

    /** Runs inside the child's tap, because iOS blocks audio that starts any later. */
    playCheer() {
      const { cheer } = get();
      if (!cheer) return;
      speaker.stop();
      clip.stop();
      if (cheer.audio) clip.play(cheer.audio);
      else speaker.say({ key: 'cheer.from' });
    },

    /** Marked as heard only here, so closing the app mid-cheer keeps it for next time. */
    finishCheer() {
      const { cheer, progress: data } = get();
      clip.stop();
      if (!cheer || !data) return;
      const played = { ...cheer, playedAt: now(), updatedAt: now() };
      set({
        cheer: undefined,
        progress: { ...data, cheers: data.cheers.filter((c) => c.id !== cheer.id) },
      });
      save({ cheer: played });
      play('tap');
      beginQuest();
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
        const scored = settle(where(next), problem, 'missed', ms, 0);
        updateRun(next, { attempt, ...scored });
        speaker.say({ key: 'feedback.show-answer' }, () => speaker.say(answerSpeech(problem)));
        return;
      }

      set({ feedback: result, mood: 'happy' });
      play('correct');
      const cardBefore = problem.factId ? get().progress?.cards.get(problem.factId) : undefined;
      const scored = settle(where(next), problem, result.outcome, ms, result.coins);
      // Missions belong to the quest; free play can't finish them.
      const events: MissionEvent[] = next.quest.free
        ? []
        : [{ type: 'answer', inARow: next.inARow }];
      if (!next.quest.free && result.tryNumber === 1 && beatsFastTime(cardBefore, true, ms)) {
        events.push({ type: 'fact-beat' });
      }
      const missions = advanceMissions(events);
      updateRun(
        { ...next, coins: next.coins + missions.coins },
        { attempt, ...scored, ...missions.change, ...rewardRows() },
      );
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
      else if (run?.stage === 'offer-challenge') speaker.say(challengeOffer());
    },

    /** Leaving is free: the quest stays exactly where it is for later. */
    goHome() {
      speaker.stop();
      const { run, session, blitz } = get();
      if ((run?.quest.free || blitz) && session) {
        // Free play isn't resumed. What was earned is already saved, answer by answer.
        const ended: Session = { ...session, endedAt: now(), updatedAt: now() };
        delete ended.run;
        save({ session: ended });
        set({ run: undefined, session: undefined, blitz: undefined });
      }
      const finished = get().run?.stage === 'finished';
      set({ screen: 'home', feedback: undefined, ...(finished ? { run: undefined } : {}) });
    },

    /** Secondary on purpose: it only opens once today's quest is done. */
    startPractice(skillId: string) {
      const { child, progress: data, todayDone } = get();
      const skill = skillById(skillId);
      if (!child || !data || !skill || !todayDone) return;
      actions.unlockAudio();
      const at = now();
      const seed = hashSeed(`${child.id}|${at}|practice`);
      const quest = buildPractice({
        childId: child.id,
        today: today(),
        skill,
        state: data.states[skillId],
        rng: mulberry32(seed),
        seed,
      });
      const run = beginSection(startRun(quest));
      const session = newSession(child.id, 'free', at, run);
      set({ session, run, screen: 'quest', newBadges: [] });
      save({ session });
      present(run);
    },

    startBlitz(skillId: string) {
      const { child, todayDone } = get();
      if (!child || !todayDone) return;
      actions.unlockAudio();
      const at = now();
      const id = crypto.randomUUID();
      const rng = mulberry32(hashSeed(`${id}|blitz`));
      blitzRng = rng;
      const session = newSession(child.id, 'blitz', at);
      const problem = nextBlitzProblem(skillId, undefined, rng);
      set({ session, screen: 'blitz', blitz: { id, skillId, problem, score: 0, coins: 0 } });
      save({ session });
      shownAt = now();
      speechEndedAt = undefined;
      speaker.say({ key: 'blitz.go' });
      after(BLITZ_MS, () => {
        if (get().blitz?.id === id) actions.finishBlitz();
      });
    },

    /** One try each: it's a game, so a miss just moves on, with no sound of failure. */
    answerBlitz(given: string, stoppedAt = now()) {
      const { blitz, session, progress: data } = get();
      if (!blitz || !session || !data) return;
      const { problem } = blitz;
      const correct = isCorrect(problem, given);
      const ms = Math.max(0, stoppedAt - shownAt);
      const fast = ms <= fastMsFor(problem);
      const coins = coinsForAnswer({ correct, fast, recovered: false, mode: 'free' });
      const attempt = attemptRow(problem, given, ms, 1, correct);
      play(correct ? 'correct' : 'tap');
      const outcome = !correct ? 'missed' : fast ? 'fast' : 'slow';
      const scored = settle({ date: session.date }, problem, outcome, ms, coins);
      const next = nextBlitzProblem(blitz.skillId, problem, need(blitzRng));
      const updated: Session = {
        ...session,
        problemsCount: session.problemsCount + 1,
        correctCount: session.correctCount + (correct ? 1 : 0),
        coinsEarned: session.coinsEarned + coins,
        updatedAt: now(),
      };
      set({
        session: updated,
        blitz: {
          ...blitz,
          problem: next,
          score: blitz.score + (correct ? 1 : 0),
          coins: blitz.coins + coins,
        },
      });
      save({ attempt, session: updated, ...scored });
      shownAt = now();
    },

    finishBlitz() {
      const { blitz, progress: data, child } = get();
      if (!blitz || !data || !child) return;
      const state = data.states[blitz.skillId] ?? newSkillState(child.id, blitz.skillId);
      const record = recordBlitz(state, blitz.score, now());
      const states = { ...data.states, [blitz.skillId]: record.state };
      set({ progress: { ...data, states } });
      if (record.isBest) save({ skills: [record.state] });
      const { score, coins } = blitz;
      endFreeSession(
        { coins, score, best: record.best, isBest: record.isBest },
        record.isBest
          ? { key: 'blitz.best', params: { score } }
          : { key: 'blitz.done', params: { score, best: record.best } },
      );
    },

    /** One level down from Home, and the mascot is always one tap from it. */
    go(place: Place) {
      play('tap');
      set({ screen: place });
      speaker.say({ key: PLACE_LINE[place] });
    },

    say(line: Speech) {
      play('tap');
      speaker.say(line);
    },

    openChest() {
      const state = get();
      const data = need(state.progress);
      if (state.openedChest) return;
      const { reward, inventory } = openNextChest(data.inventory, now());
      if (!reward) return;
      play('cheer');
      set({ openedChest: reward, progress: { ...data, inventory }, mood: 'cheer' });
      save({ inventory });
      const name = reward.itemId ? render(`item.${reward.itemId}`) : '';
      const isCosmetic = reward.itemId !== undefined && cosmeticFor(reward.itemId) !== undefined;
      const line: Speech = reward.shield
        ? { key: 'chest.shield' }
        : isCosmetic
          ? { key: 'chest.present' }
          : reward.duplicate
            ? { key: 'chest.again', params: { item: name } }
            : reward.itemId
              ? { key: 'chest.item', params: { item: name } }
              : { key: 'chest.coins', params: { coins: reward.coins } };
      sayInOrder(reward.setCompleted ? [line, { key: 'chest.set-done' }] : [line]);
    },

    closeChest() {
      play('tap');
      set({ openedChest: undefined });
      const { progress: data, screen, farewell } = get();
      if (data?.inventory.unopened.length) return;
      speaker.say(screen === 'celebrate' && farewell ? farewell : { key: 'home.done' });
    },

    /** Tapping something owned wears it or takes it off. Buying takes a second, separate tap. */
    toggleWear(id: string) {
      const data = need(get().progress);
      const cosmetic = need(cosmeticFor(id));
      play('tap');
      const inventory = toggleCosmetic(data.inventory, cosmetic, now());
      set({ progress: { ...data, inventory } });
      save({ inventory });
    },

    buy(id: string) {
      const data = need(get().progress);
      const cosmetic = need(cosmeticFor(id));
      const bought = buyCosmetic(data.wallet, data.inventory, cosmetic, now());
      if (!bought) return;
      play('cheer');
      set({ progress: { ...data, ...bought } });
      save(bought);
      speaker.say({ key: 'shop.bought' });
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
