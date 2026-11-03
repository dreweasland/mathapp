import type { SkillDef } from '@mathapp/engine';
import { GRADE_1_SKILLS } from './grade1';
import { GRADE_2_SKILLS } from './grade2';
import { GRADE_3_SKILLS } from './grade3';

/** The whole graph. The frontier works through it lowest grade first. */
export const ALL_SKILLS: SkillDef[] = [...GRADE_1_SKILLS, ...GRADE_2_SKILLS, ...GRADE_3_SKILLS];

export const skillsInGrade = (grade: SkillDef['grade']): SkillDef[] =>
  ALL_SKILLS.filter((s) => s.grade === grade);

export const skillById = (id: string): SkillDef | undefined => ALL_SKILLS.find((s) => s.id === id);
