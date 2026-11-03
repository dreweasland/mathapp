import { WORD_SCENES } from '@mathapp/engine';
import { ITEM_NAMES } from './collectibles';
import { GRADE_1_SKILLS } from './grade1';
import { GRADE_2_SKILLS } from './grade2';
import { GRADE_3_SKILLS } from './grade3';

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

  // Grade 2
  'q.pv3-value': 'What number is {hundreds} hundreds, {tens} tens and {ones} ones?',
  'q.pv3-hundreds': 'How many hundreds are in {n}?',
  'q.pv3-tens': 'How many tens are in the tens place of {n}?',
  'q.pv3-ones': 'How many ones are in the ones place of {n}?',
  'q.skip': 'Count by {size}. What comes after {from}?',
  'q.skip-back': 'Count back by {size}. What comes after {from}?',
  'q.even-odd': 'Is {n} even or odd?',
  'q.next-even': '{n} is even. What is the next even number?',
  'q.next-odd': '{n} is odd. What is the next odd number?',
  'q.array': 'There are {rows} rows with {cols} in each row. How many in all?',
  'q.money-cents': 'How many cents is this?',
  'q.money-dollars': 'How many dollars is this?',
  'q.money-change':
    'You pay one dollar for something that costs {cost} cents. How many cents do you get back?',
  'q.money-make': 'Which coins make {target} cents?',
  'q.time-past': 'Tap the clock that shows {minute} minutes after {hour}.',
  'q.ampm.breakfast': 'You eat breakfast at 7. Is that a.m. or p.m.?',
  'q.ampm.school-bus': 'The school bus comes at 8. Is that a.m. or p.m.?',
  'q.ampm.sunrise': 'The sun comes up at 6. Is that a.m. or p.m.?',
  'q.ampm.dinner': 'You eat dinner at 6. Is that a.m. or p.m.?',
  'q.ampm.bedtime': 'You go to bed at 8. Is that a.m. or p.m.?',
  'q.ampm.stars': 'The stars are out at 9. Is that a.m. or p.m.?',
  'q.word2.stickers':
    'You have {a} stickers. You get {b} more, then give {c} to a friend. How many stickers do you have now?',
  'q.word2.marbles':
    'A jar has {a} marbles. You take out {b}, then {c} more. How many marbles are in the jar now?',
  'q.word2.books':
    'A shelf has {a} books. You add {b} books, then {c} more. How many books are on the shelf now?',
  'q.word2.bus':
    'A bus has {a} riders. {b} get off, then {c} get on. How many riders are on the bus now?',
  'q.ruler-in': 'How many inches long is it?',
  'q.ruler-cm': 'How many centimeters long is it?',
  'q.estimate-in': 'About how many inches long is a {object}?',
  'q.estimate-cm': 'About how many centimeters long is a {object}?',

  // Grade 3
  'q.mult-groups': 'There are {rows} groups with {cols} in each group. How many in all?',
  'q.mult-array': 'There are {rows} rows with {cols} in each row. How many in all?',
  'q.mult-area': 'This rectangle has {rows} rows of {cols} squares. How many squares?',
  'q.mult': 'What is {a} times {b}?',
  'q.div': 'What is {a} divided by {b}?',
  'q.share-each': 'Share {total} equally into {parts} groups. How many in each group?',
  'q.share-groups': 'Put {total} into equal groups of {each}. How many groups?',
  'q.unknown-factor': '{known} times what makes {product}?',
  'q.family-md-flip': '{a} times {b} is {product}. So what is {b} times {a}?',
  'q.family-md-div-a': '{a} times {b} is {product}. So what is {product} divided by {a}?',
  'q.family-md-div-b': '{a} times {b} is {product}. So what is {product} divided by {b}?',
  'q.round': 'Round {n} to the nearest {to}.',
  'q.fraction-shape': 'What fraction is colored in?',
  'q.fraction-parts': 'How many equal parts is this cut into?',
  'q.fraction-line': 'What fraction is the dot on the number line?',
  'q.fraction-line-parts': 'How many equal parts are between 0 and 1?',
  'q.fraction-bigger': 'Which is bigger, {an} over {ad} or {bn} over {bd}? Or are they the same?',
  'q.compare-symbol-fraction': 'Which sign goes between {an} over {ad} and {bn} over {bd}?',
  'q.fraction-equal': '{n} over {d} is the same as what over {bottom}?',
  'q.elapsed-minutes': 'It starts at {start} and ends at {end}. How many minutes is that?',
  'q.elapsed-end': 'It is {start}. {passed} minutes go by. What time is it now?',
  'q.area': 'The rectangle is {w} long and {h} wide. How many squares cover it?',
  'q.perimeter': 'The rectangle is {w} long and {h} wide. How far is it all the way around?',
  'q.word4.apple-bags':
    'There are {a} bags with {b} apples in each. You eat {c} apples. How many apples are left?',
  'q.word4.egg-boxes':
    'There are {a} boxes with {b} eggs in each, plus {c} more eggs. How many eggs in all?',
  'q.word4.share-cookies':
    'You bake {a} cookies, then {b} more. {c} friends share them equally. How many does each friend get?',
  'q.word4.team-seats':
    'There are {a} seats. {b} are taken. The rest are shared equally by {c} teams. How many seats does each team get?',

  // Saying the answer out loud, when it's shown
  'answer.number': 'The answer is {value}.',
  'answer.time-hour': "It's {hour} o'clock.",
  'answer.time-half': "It's half past {hour}.",
  'answer.time-minutes': "It's {time}.",
  'answer.shape': 'This one is the {shape}.',
  'answer.this-one': 'It is this one.',
  'answer.bigger': '{n} is bigger.',
  'answer.same': 'They are the same.',
  'answer.greater': '{a} is greater than {b}.',
  'answer.less': '{a} is less than {b}.',
  'answer.equal': '{a} is equal to {b}.',
  'answer.family': '{whole} take away {a} is {b}.',
  'answer.word': 'It is {word}.',
  'answer.fraction': 'It is {n} over {d}.',
  'answer.fraction-same': 'They are the same size.',
  'answer.fraction-bigger': '{n} over {d} is bigger.',

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
  ...Object.fromEntries(
    [...GRADE_2_SKILLS, ...GRADE_3_SKILLS].map((s) => [s.speechKey, s.kidName]),
  ),

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

  digit: '{digit}',

  // Teaching
  'worked.watch': 'Watch how this one works.',
  'worked.next': 'Now tap the arrow.',

  // Daily loop
  'quest.warmup': "Let's warm up!",
  'quest.skill': "Here's today's adventure.",
  'quest.challenge': 'Want a challenge? You can say yes or skip it.',
  'quest.challenge-goal':
    'Your goal today is the quest and the challenge. Ready? You can still skip it.',
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

  // Badges, read aloud on the trophy wall
  ...Object.fromEntries(
    [...GRADE_1_SKILLS, ...GRADE_2_SKILLS, ...GRADE_3_SKILLS].map((s) => [
      `badge.${s.id}`,
      s.badgeName,
    ]),
  ),
  'badge.earned': 'You earned a new badge! {badge}!',
  'badge.waiting': '{badge}. You can earn this one!',

  // Things to find and wear
  ...ITEM_NAMES,
  'chest.tap': 'Tap the chest to open it!',
  'chest.item': 'You found the {item}!',
  'chest.again': 'Another {item}! Here are some coins too.',
  'chest.coins': '{coins} coins!',
  'chest.shield': 'You found a shield for your plant!',
  'chest.present': 'A present for your bear!',
  'chest.set-done': 'You finished the whole collection! A new one is ready.',

  // Places
  'nav.map': 'This is your map. Tap a spot to hear its name.',
  'nav.trophies': 'These are your badges.',
  'nav.stickers': 'This is your animal collection.',
  'nav.shop': 'Dress up your bear!',
  'map.here': '{skill}. You are here!',
  'map.earned': '{skill}. You did it!',
  'map.open': '{skill}. This one is open.',
  'map.next': '{skill}. Keep going to open this one.',
  'sticker.waiting': 'You can find this one in a chest.',
  'shop.try': 'Do you like it? Tap the coin to buy it.',
  'shop.need': 'You need {coins} more coins. Keep practicing!',
  'shop.bought': 'It looks great!',
  'plant.days': 'Your plant is {days} days old. Your best is {best}.',
  'plant.seed': 'Do a quest and your plant will grow. Your best is {best}.',
  'shield.count': 'You have {count} shields. They keep your plant safe.',
  'certificate.days': 'You practiced {days} days in a row!',

  // Grown-ups, goals and cheers
  'nav.grownups': 'This part is for grown-ups.',
  'who.pick': 'Who is playing? Tap your picture.',
  'daily.met': "That's the quest and the challenge. You met your goal!",
  'goal.quests': 'You did {done} of {target} quests. Then it is time for {reward}!',
  'goal.perfect-weeks': 'You did {done} of {target} perfect weeks. Then it is time for {reward}!',
  'goal.skills': 'You earned {done} of {target} badges. Then it is time for {reward}!',
  'goal.ready': 'You did it! Time for {reward}! Go tell your grown-up.',
  'goal.reached': 'You reached your goal! Time for {reward}! Go tell your grown-up.',
  'cheer.from': 'A cheer from your grown-up!',

  // Free play
  'nav.free': 'Free play! The lightning is a fast game. The rest is practice.',
  'free.done': 'Nice practice! You earned {coins} coins.',
  'blitz.go': 'Go! Get as many as you can.',
  'blitz.done': 'You got {score}. Your best is {best}.',
  'blitz.best': 'That is your new best! {score}!',
  'free.empty': 'Finish a quest to open this up.',

  // Missions
  'mission.in-a-row': 'Get {target} in a row.',
  'mission.finish-quest': "Finish today's quest.",
  'mission.finish-challenge': 'Finish the challenge.',
  'mission.fast-facts': 'Beat your fast time on {target} facts.',
  'mission.all-done': 'All three missions! You get a bonus chest!',
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
