import type { ChildSettings } from '@mathapp/engine';
import { lazy, Suspense, useEffect, type JSX } from 'react';
import { useGame } from './game/GameProvider';
import { BadgeReveal } from './screens/BadgeReveal';
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
const LOADERS = {
  Celebrate: () => import('./screens/Celebrate'),
  ChestReveal: () => import('./screens/ChestReveal'),
  Map: () => import('./screens/Map'),
  Shop: () => import('./screens/Shop'),
  Stickers: () => import('./screens/Stickers'),
  Trophies: () => import('./screens/Trophies'),
  Free: () => import('./screens/Free'),
  Blitz: () => import('./screens/Blitz'),
};

const named = <K extends string>(
  load: () => Promise<Record<K, () => JSX.Element | null>>,
  key: K,
) => lazy(() => load().then((m) => ({ default: m[key] })));

const Parent = lazy(() => import('./parent/entry'));
const SetupRestore = lazy(() => import('./parent/restoreEntry'));
const Celebrate = named(LOADERS.Celebrate, 'Celebrate');
const ChestReveal = named(LOADERS.ChestReveal, 'ChestReveal');
const SkillMap = named(LOADERS.Map, 'SkillMap');
const Shop = named(LOADERS.Shop, 'Shop');
const Stickers = named(LOADERS.Stickers, 'Stickers');
const Trophies = named(LOADERS.Trophies, 'Trophies');
const Blitz = named(LOADERS.Blitz, 'Blitz');
const Free = named(LOADERS.Free, 'Free');
const FreeDone = named(LOADERS.Free, 'FreeDone');

/** After the first paint, so nothing a child opens later has to blank the screen to load. */
const AFTER_FIRST_PAINT_MS = 500;
function loadTheRest() {
  for (const load of Object.values(LOADERS)) void load();
}

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
          restore={(back) => (
            <Suspense fallback={null}>
              <SetupRestore onRestored={() => void actions.open()} onBack={back} />
            </Suspense>
          )}
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
  const badgeWaiting = use((s) => s.badgeShow.length > 0);
  useEffect(() => applySettings(settings), [settings]);
  useEffect(() => {
    void actions.open();
    const preload = setTimeout(loadTheRest, AFTER_FIRST_PAINT_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void actions.checkNewDay();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(preload);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [actions]);
  return (
    <>
      <Suspense fallback={null}>
        <Screen />
      </Suspense>
      {/* Its own boundary, so loading it can't blank the screen behind the chest. */}
      <Suspense fallback={null}>{chestOpen && <ChestReveal />}</Suspense>
      {badgeWaiting && <BadgeReveal />}
    </>
  );
}
