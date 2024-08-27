import React, {
  type ReactNode,
  type Context,
  createContext,
  useContext,
  useMemo,
  useCallback,
} from 'react';

import type { Game } from '@bgi/shared';

import useLocalStorage from './useLocalStorage';

type GameDataType = Game | null;

export type GameContextType = {
  game: GameDataType;
  updateGame: (data: GameDataType) => void;
  discardGame: () => void;
};

// Create a context with a default empty value.
const GameContext: Context<GameContextType | undefined> = createContext<
  GameContextType | undefined
>(undefined);

type GameProviderProps = {
  children: ReactNode;
};

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [game, setGame] = useLocalStorage<Game | null>('game', null);

  // Call this function to leave from the game
  const discardGame = useCallback(() => {
    setGame(null);
  }, [setGame]);

  // Call this function to join or update the game info
  const updateGame = useCallback(
    (data: GameDataType) => {
      setGame(data);
    },
    [setGame]
  );

  const value = useMemo(
    () => ({
      game,
      discardGame,
      updateGame,
    }),
    [discardGame, game, updateGame]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    /** @todo - Handle error */
    throw new Error('useGame() hook must be used within a <GameProvider />.');
  }

  return context;
};
