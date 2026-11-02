import type { ChildSettings } from '@mathapp/engine';
import { lazy, Suspense, useEffect, type JSX } from 'react';
import { useGame } from './game/GameProvider';
import { Cheer } from './screens/Cheer';
import { Home } from './screens/Home';
import { Placement } from './screens/Placement';
import { Quest } from './screens/Quest';
import { Setup } from './screens/Setup';
import { Who } from './screens/Who';

/**
 * Home and the quest load first. Everything else, including the animation library, arrives
 * on first use. The service worker precaches all of it, so offline still works.
 */
const Parent = lazy(() => import('./parent/entry'));
const named = <K extends string>(
  load: () => Promise<Record<K, () => JSX.Element | null>>,
  key: K,
) => lazy(() => load().then((m) => ({ default: m[key] })));
const Celebrate = named(() => import('./screens/Celebrate'), 'Celebrate');
const ChestReveal = named(() => import('./screens/ChestReveal'), 'ChestReveal');
const SkillMap = named(() => import('./screens/Map'), 'SkillMap');
const Shop = named(() => import('./screens/Shop'), 'Shop');
const Stickers = named(() => import('./screens/Stickers'), 'Stickers');
const Trophies = named(() => import('./screens/Trophies'), 'Trophies');
const Blitz = named(() => import('./screens/Blitz'), 'Blitz');
const Free = named(() => import('./screens/Free'), 'Free');
const FreeDone = named(() => import('./screens/Free'), 'FreeDone');
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
          onDone={(name, avatar, dailyGoal, grade) =>
            void actions.createChild({ name, avatar, dailyGoal, grade })
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
      return <Parent onExit={() => void actions.closeParent()} />;
    case 'placement':
      return <Placement />;
    case 'home':
      return <Home />;
    case 'cheer':
      return <Cheer />;
    case 'blitz':
      return <Blitz />;
    case 'free':
      return <Free />;
    case 'free-done':
      return <FreeDone />;
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

/** On the root element, so plain CSS can reach everything, including print. */
function applySettings(settings: ChildSettings | undefined) {
  const { dataset } = document.documentElement;
  dataset['motion'] = settings?.reduceMotion ? 'reduced' : 'full';
  dataset['palette'] = settings?.colorBlindSafe ? 'safe' : 'standard';
  dataset['hand'] = settings?.handedness ?? 'right';
}

export function App() {
  const { actions, use } = useGame();
  const settings = use((s) => s.child?.settings);
  const chestOpen = use((s) => s.openedChest !== undefined);
  useEffect(() => applySettings(settings), [settings]);
  useEffect(() => {
    void actions.open();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void actions.checkNewDay();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [actions]);
  return (
    <>
      <Suspense fallback={null}>
        <Screen />
      </Suspense>
      {/* Its own boundary, so loading it can't blank the screen behind the chest. */}
      <Suspense fallback={null}>{chestOpen && <ChestReveal />}</Suspense>
    </>
  );
}
