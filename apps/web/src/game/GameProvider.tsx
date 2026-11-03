import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useStore } from 'zustand';
import type { Speaker } from '../audio/speech';
import type { Game, GameState } from './store';

interface GameContextValue extends Game {
  use: <T>(pick: (state: GameState) => T) => T;
  audioOk: boolean;
  sayDigit: (digit: string) => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({
  game,
  speaker,
  children,
}: {
  game: Game;
  speaker: Speaker;
  children: ReactNode;
}) {
  const value = useMemo<GameContextValue>(
    () => ({
      ...game,
      use: (pick) => useStore(game.store, pick),
      audioOk: speaker.available,
      sayDigit: game.actions.sayDigit,
    }),
    [game, speaker],
  );
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame needs a GameProvider');
  return value;
}
