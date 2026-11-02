import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';
import { useGame } from '../game/GameProvider';

/** Follows the child's setting as well as the device's. Only animated screens load this. */
export function Motion({ children }: { children: ReactNode }) {
  const { use } = useGame();
  const reduced = use((s) => s.child?.settings.reduceMotion);
  return <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>{children}</MotionConfig>;
}
