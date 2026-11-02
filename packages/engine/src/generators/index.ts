import type { Generator } from '../types';
import { addSub1000, addSub1000Fluent } from './addSub1000';
import { addWithin100 } from './addWithin100';
import { areaPerimeter } from './areaPerimeter';
import { arrays } from './arrays';
import { compare1000 } from './compare1000';
import { divConcept } from './divConcept';
import { divFacts } from './divFacts';
import { evenOdd } from './evenOdd';
import { factFamiliesMd } from './factFamiliesMd';
import { factsWithin20 } from './factsWithin20';
import { fractionsCompare } from './fractionsCompare';
import { fractionsUnit } from './fractionsUnit';
import { measureUnits } from './measureUnits';
import { money } from './money';
import { multConcept } from './multConcept';
import { multFacts } from './multFacts';
import { placeValue1000 } from './placeValue1000';
import { rounding } from './rounding';
import { subWithin100 } from './subWithin100';
import { time5Min } from './time5Min';
import { timeMinute } from './timeMinute';
import { wordProblems2Step } from './wordProblems2Step';
import { wordProblems4Ops } from './wordProblems4Ops';
import { addSub10s } from './addSub10s';
import { addWithin10 } from './addWithin10';
import { addWithin20 } from './addWithin20';
import { compare } from './compare';
import { counting } from './counting';
import { factFamilies } from './factFamilies';
import { measure } from './measure';
import { placeValue } from './placeValue';
import { shapes } from './shapes';
import { subWithin10 } from './subWithin10';
import { subWithin20 } from './subWithin20';
import { tenFrame } from './tenFrame';
import { time } from './time';
import { wordProblems } from './wordProblems';

export const GENERATORS: Record<string, Generator> = {
  '1.counting': counting,
  '1.ten-frame': tenFrame,
  '1.add-within-10': addWithin10,
  '1.sub-within-10': subWithin10,
  '1.add-within-20': addWithin20,
  '1.sub-within-20': subWithin20,
  '1.fact-families': factFamilies,
  '1.compare': compare,
  '1.place-value': placeValue,
  '1.add-sub-10s': addSub10s,
  '1.word-problems': wordProblems,
  '1.time': time,
  '1.shapes': shapes,
  '1.measure': measure,
  '2.facts-within-20': factsWithin20,
  '2.place-value-1000': placeValue1000,
  '2.compare-1000': compare1000,
  '2.add-within-100': addWithin100,
  '2.sub-within-100': subWithin100,
  '2.add-sub-1000': addSub1000,
  '2.even-odd': evenOdd,
  '2.arrays': arrays,
  '2.money': money,
  '2.time-5min': time5Min,
  '2.word-problems-2step': wordProblems2Step,
  '2.measure-units': measureUnits,
  '3.mult-concept': multConcept,
  '3.mult-facts': multFacts,
  '3.div-concept': divConcept,
  '3.div-facts': divFacts,
  '3.fact-families-md': factFamiliesMd,
  '3.add-sub-1000': addSub1000Fluent,
  '3.round': rounding,
  '3.fractions-unit': fractionsUnit,
  '3.fractions-compare': fractionsCompare,
  '3.time-minute': timeMinute,
  '3.area-perimeter': areaPerimeter,
  '3.word-problems-4ops': wordProblems4Ops,
};

export function generatorFor(skillId: string): Generator {
  const generator = GENERATORS[skillId];
  if (!generator) throw new Error(`No generator for skill ${skillId}`);
  return generator;
}

export { WORD_SCENES } from './wordProblems';
export { TWO_STEP_STORIES } from './wordProblems2Step';
export { FOUR_OP_STORIES } from './wordProblems4Ops';
export { DAY_SCENES } from './time5Min';
export { OBJECT_SIZES } from './measureUnits';
