import { MotionConfig } from 'framer-motion';
import { useEffect } from 'react';
import { useGame } from './game/GameProvider';
import { Celebrate } from './screens/Celebrate';
import { Home } from './screens/Home';
import { Placement } from './screens/Placement';
import { Quest } from './screens/Quest';
import { Setup } from './screens/Setup';

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
    </MotionConfig>
  );
}
