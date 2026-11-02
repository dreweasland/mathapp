import { WORD_SCENES } from '@mathapp/engine';

/**
 * Every line the app speaks. `{name}` is filled from the speech params. Recorded clips can
 * replace any line later by matching on its key.
 *
 * Rules: praise effort and growth, never intelligence. Look forward, never mention loss.
 */
const WORD_STORIES: Record<string, string> = {
  'q.word.add-to.ducks':
    '{a} ducks are on the pond. {b} more ducks swim over. How many ducks are there now?',
  'q.word.add-to.bunnies':
    '{a} bunnies are in the garden. {b} more bunnies hop in. How many bunnies are there now?',
  'q.word.add-to.birds':
    '{a} birds sit in a tree. {b} more birds fly in. How many birds are there now?',
  'q.word.take-from.frogs':
    '{a} frogs sit on a log. {b} frogs hop away. How many frogs are still on the log?',
  'q.word.take-from.fish':
    '{a} fish swim by the rock. {b} fish swim away. How many fish are still by the rock?',
  'q.word.take-from.squirrels':
    '{a} squirrels are in the tree. {b} squirrels climb down. How many squirrels are still in the tree?',
  'q.word.put-together.cats-dogs':
    'There are {a} cats and {b} dogs. How many pets are there in all?',
  'q.word.put-together.hens-chicks':
    'There are {a} hens and {b} chicks. How many birds are there in all?',
  'q.word.put-together.red-blue-butterflies':
    'There are {a} red butterflies and {b} blue butterflies. How many butterflies are there in all?',
};

export const STRINGS: Record<string, string> = {
  // Problems
  'q.add': 'What is {a} plus {b}?',
  'q.sub': 'What is {a} take away {b}?',
  'q.next': 'What number comes after {n}?',
  'q.previous': 'What number comes before {n}?',
  'q.find-number': 'Find the number {n}.',
  'q.count-dots': 'How many dots do you see?',
  'q.fill-frame': 'Tap to show {n} dots.',
  'q.make-ten': 'You have {n}. How many more to make 10?',
  'q.unknown-addend': '{known} plus what makes {whole}?',
  'q.family-flip': '{a} plus {b} is {whole}. So what is {b} plus {a}?',
  'q.family-sub-a': '{a} plus {b} is {whole}. So what is {whole} take away {a}?',
  'q.family-sub-b': '{a} plus {b} is {whole}. So what is {whole} take away {b}?',
  'q.family-belongs': 'Which one is true, and goes with {a}, {b} and {whole}?',
  'q.compare-tap': 'Which is bigger, {a} or {b}? Or are they the same?',
  'q.compare-symbol': 'Which sign goes between {a} and {b}?',
  'q.pv-value': 'What number is {tens} tens and {ones} ones?',
  'q.pv-tens': 'How many tens are in {n}?',
  'q.pv-ones': 'How many ones are in {n}?',
  'q.time-hour': "Tap the clock that shows {hour} o'clock.",
  'q.time-half': 'Tap the clock that shows half past {hour}.',
  'q.time-read': 'What time does the clock show?',
  'q.shape-name': 'Tap the {shape}.',
  'q.shape-sides': 'How many sides does a {shape} have?',
  'q.shares-halves': 'Which one is cut into two equal parts?',
  'q.shares-quarters': 'Which one is cut into four equal parts?',
  'q.measure-longest': 'Tap the longest one.',
  'q.measure-shortest': 'Tap the shortest one.',
  'q.measure-middle': 'Tap the one in the middle. Not the longest, and not the shortest.',
  ...WORD_STORIES,

  // Saying the answer out loud, when it's shown
  'answer.number': 'The answer is {value}.',
  'answer.time-hour': "It's {hour} o'clock.",
  'answer.time-half': "It's half past {hour}.",
  'answer.shape': 'This one is the {shape}.',
  'answer.this-one': 'It is this one.',
  'answer.bigger': '{n} is bigger.',
  'answer.same': 'They are the same.',
  'answer.greater': '{a} is greater than {b}.',
  'answer.less': '{a} is less than {b}.',
  'answer.equal': '{a} is equal to {b}.',
  'answer.family': '{whole} take away {a} is {b}.',

  // Skills, read aloud on the map
  'skill.1.counting': 'Counting',
  'skill.1.ten-frame': 'Ten frames',
  'skill.1.add-within-10': 'Adding to ten',
  'skill.1.sub-within-10': 'Taking away',
  'skill.1.add-within-20': 'Adding to twenty',
  'skill.1.sub-within-20': 'Taking away from twenty',
  'skill.1.fact-families': 'Number families',
  'skill.1.place-value': 'Tens and ones',
  'skill.1.compare': 'Bigger or smaller',
  'skill.1.add-sub-10s': 'Jumping by tens',
  'skill.1.word-problems': 'Story math',
  'skill.1.time': 'Clocks',
  'skill.1.shapes': 'Shapes',
  'skill.1.measure': 'Long and short',

  // Feedback
  'feedback.correct.1': 'Yes!',
  'feedback.correct.2': 'You got it!',
  'feedback.correct.3': 'Nice work!',
  'feedback.retry': 'Not yet. Look at this and try again.',
  'feedback.show-answer': "That one was tricky. Here's how it works.",
  'feedback.recovered': 'You kept trying, and you got it!',
  'feedback.tricky-solved': 'That one was tricky and you got it!',

  // Home and first run
  'home.start': "Tap the big button to start today's quest.",
  'home.resume': 'Tap the big button to keep going.',
  'home.done': "You finished today's quest! See you tomorrow!",
  'placement.intro': "Let's see what you know. Just try your best!",
  'placement.next': 'Thanks!',
  'placement.done': 'Thanks for showing me. Now we can start!',

  // Teaching
  'worked.watch': 'Watch how this one works.',
  'worked.next': 'Now tap the arrow.',

  // Daily loop
  'quest.warmup': "Let's warm up!",
  'quest.skill': "Here's today's adventure.",
  'quest.challenge': 'Want a challenge? You can say yes or skip it.',
  'quest.challenge-skip': 'No problem. Great work today!',
  'quest.challenge-start': 'Here comes the challenge!',
  'quest.coins': 'You earned {coins} coins!',
  'quest.done': 'You did it! See you tomorrow!',
  'quest.rough-day': 'You kept going today. See you tomorrow!',
  'streak.new': 'New streak starts today! Your best was {best}.',
  'streak.first': 'Your first day! Your plant is growing.',
  'streak.grew': 'Your plant grew a new leaf!',
  'streak.shielded': 'Your shield kept your plant safe.',
  'streak.milestone': '{days} days! Look how much your plant has grown!',
  'streak.perfect-week': 'A perfect week! Here comes a big chest!',
  'streak.shield-earned': 'You earned a shield!',

  // Missions
  'mission.in-a-row': 'Get {target} in a row.',
  'mission.finish-quest': "Finish today's quest.",
  'mission.finish-challenge': 'Finish the challenge.',
  'mission.fast-facts': 'Beat your fast time on {target} facts.',
};

export function render(key: string, params: Record<string, string | number> = {}): string {
  const template = STRINGS[key];
  if (template === undefined) throw new Error(`Missing speech string: ${key}`);
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Missing param {${name}} for ${key}`);
    return String(value);
  });
}

export const SCENE_COUNT = Object.values(WORD_SCENES).flat().length;
