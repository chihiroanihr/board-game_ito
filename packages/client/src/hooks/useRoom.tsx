import React, {
  type ReactNode,
  type Context,
  createContext,
  useContext,
  useMemo,
  useCallback,
} from 'react';

import type { Room } from '@bgi/shared';

import { useLocalStorage } from './useLocalStorage';

type RoomDataType = Room | null;

type RoomProviderProps = {
  children: ReactNode;
};

export type RoomContextType = {
  room: RoomDataType;
  updateRoom: (data: RoomDataType) => void;
  discardRoom: () => void;
};

// Create a context with a default empty value.
const RoomContext: Context<RoomContextType | undefined> = createContext<
  RoomContextType | undefined
>(undefined);

export const RoomProvider: React.FC<RoomProviderProps> = ({ children }) => {
  const [room, setRoom] = useLocalStorage<Room | null>('room', null);

  // Call this function to leave from the room
  const discardRoom = useCallback(() => {
    setRoom(null);
  }, [setRoom]);

  // Call this function to join or update the room info
  const updateRoom = useCallback(
    (data: RoomDataType) => {
      setRoom(data);
    },
    [setRoom]
  );

  const value = useMemo(
    () => ({
      room,
      discardRoom,
      updateRoom,
    }),
    [discardRoom, room, updateRoom]
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};

export const useRoom = (): RoomContextType => {
  const context = useContext(RoomContext);
  if (!context) {
    /** @todo - Handle error */
    throw new Error('useRoom() hook must be used within a <RoomProvider />.');
  }

  return context;
};
