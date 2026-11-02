import { MotionConfig } from 'framer-motion';
import { lazy, Suspense, useEffect } from 'react';
import { useGame } from './game/GameProvider';
import { Celebrate } from './screens/Celebrate';
import { Cheer } from './screens/Cheer';
import { ChestReveal } from './screens/ChestReveal';
import { Home } from './screens/Home';
import { SkillMap } from './screens/Map';
import { Placement } from './screens/Placement';
import { Quest } from './screens/Quest';
import { Setup } from './screens/Setup';
import { Shop } from './screens/Shop';
import { Stickers } from './screens/Stickers';
import { Trophies } from './screens/Trophies';
import { Who } from './screens/Who';

/** Grown-ups only, so the child's first load doesn't carry it. Precached for offline. */
const Parent = lazy(() => import('./parent/entry'));
const SetupRestore = lazy(() => import('./parent/restoreEntry'));

function Screen() {
  const { actions, use } = useGame();
  const screen = use((s) => s.screen);
  switch (screen) {
    case 'loading':
      return null;
    case 'setup':
      return (
        <Setup
          onDone={(name, avatar, dailyGoal) =>
            void actions.createChild({ name, avatar, dailyGoal })
          }
          restore={
            <Suspense fallback={null}>
              <SetupRestore onRestored={() => void actions.open()} />
            </Suspense>
          }
        />
      );
    case 'who':
      return <Who />;
    case 'parent':
      return (
        <Suspense fallback={null}>
          <Parent onExit={() => void actions.closeParent()} />
        </Suspense>
      );
    case 'placement':
      return <Placement />;
    case 'home':
      return <Home />;
    case 'cheer':
      return <Cheer />;
    case 'quest':
      return <Quest />;
    case 'celebrate':
      return <Celebrate />;
    case 'map':
      return <SkillMap />;
    case 'trophies':
      return <Trophies />;
    case 'stickers':
      return <Stickers />;
    case 'shop':
      return <Shop />;
  }
}

export function App() {
  const { actions } = useGame();
  useEffect(() => {
    void actions.open();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void actions.checkNewDay();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [actions]);
  return (
    <MotionConfig reducedMotion="user">
      <Screen />
      <ChestReveal />
    </MotionConfig>
  );
}
