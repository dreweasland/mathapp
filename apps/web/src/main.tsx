import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { createClipPlayer } from './audio/clip';
import { createSfx } from './audio/sfx';
import { createSpeaker } from './audio/speech';
import { db } from './db/db';
import { requestPersistentStorage } from './db/persist';
import { childrenRepository } from './db/repositories/children';
import { familyRepository } from './db/repositories/family';
import { progressRepository } from './db/repositories/progress';
import { GameProvider } from './game/GameProvider';
import { createGame } from './game/store';
import { sync } from './sync/instance';
import './index.css';

registerSW({ immediate: true });
void requestPersistentStorage();

const speaker = createSpeaker();
const game = createGame({
  children: childrenRepository(db),
  progress: progressRepository(db),
  family: familyRepository(db),
  speaker,
  play: createSfx(),
  clip: createClipPlayer(),
  now: Date.now,
  after: (ms, run) => setTimeout(run, ms),
  sync,
});

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <GameProvider game={game} speaker={speaker}>
      <App />
    </GameProvider>
  </StrictMode>,
);
