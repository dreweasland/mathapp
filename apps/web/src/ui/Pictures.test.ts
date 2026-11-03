import { describe, expect, it } from 'vitest';
import { AVATAR_NAMES } from './Avatar';
import { AVATARS } from '../screens/Setup';
import { CHEER_PICTURES, GOAL_PICTURES, hasPicture, pictureName } from './Pictures';

describe('pictures a grown-up picks', () => {
  it('draws every goal and cheer choice, and names each one', () => {
    for (const [value, name] of [...GOAL_PICTURES, ...CHEER_PICTURES]) {
      expect(hasPicture(value), value).toBe(true);
      expect(pictureName(value)).toBe(name);
      expect(name).toMatch(/^[a-z ]+$/);
    }
  });
  it('names every avatar in words', () => {
    expect(AVATARS.filter((a) => !AVATAR_NAMES[a])).toEqual([]);
  });
});
