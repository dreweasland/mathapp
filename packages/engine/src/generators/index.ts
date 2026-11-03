import type { Generator } from '../types';
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
};

export function generatorFor(skillId: string): Generator {
  const generator = GENERATORS[skillId];
  if (!generator) throw new Error(`No generator for skill ${skillId}`);
  return generator;
}

export { WORD_SCENES } from './wordProblems';
