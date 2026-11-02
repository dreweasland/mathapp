import { MotionConfig } from 'framer-motion';
import { useEffect } from 'react';
import { useGame } from './game/GameProvider';
import { Celebrate } from './screens/Celebrate';
import { ChestReveal } from './screens/ChestReveal';
import { Home } from './screens/Home';
import { SkillMap } from './screens/Map';
import { Placement } from './screens/Placement';
import { Quest } from './screens/Quest';
import { Setup } from './screens/Setup';
import { Shop } from './screens/Shop';
import { Stickers } from './screens/Stickers';
import { Trophies } from './screens/Trophies';

function Screen() {
  const { actions, use } = useGame();
  const screen = use((s) => s.screen);
  switch (screen) {
    case 'loading':
      return null;
    case 'setup':
      return <Setup onDone={(name, avatar) => void actions.createChild({ name, avatar })} />;
    case 'placement':
      return <Placement />;
    case 'home':
      return <Home />;
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
