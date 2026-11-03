import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { createSfx } from './audio/sfx';
import { createSpeaker } from './audio/speech';
import { db } from './db/db';
import { requestPersistentStorage } from './db/persist';
import { childrenRepository } from './db/repositories/children';
import { progressRepository } from './db/repositories/progress';
import { GameProvider } from './game/GameProvider';
import { createGame } from './game/store';
import './index.css';

registerSW({ immediate: true });
void requestPersistentStorage();

const speaker = createSpeaker();
const game = createGame({
  children: childrenRepository(db),
  progress: progressRepository(db),
  speaker,
  play: createSfx(),
  now: Date.now,
  after: (ms, run) => setTimeout(run, ms),
});

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <GameProvider game={game} speaker={speaker}>
      <App />
    </GameProvider>
  </StrictMode>,
);
