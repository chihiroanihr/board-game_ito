import React, { type ReactNode, type Context, createContext, useContext, useMemo } from 'react';
import { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket;
}

// Create a context with a default empty value.
const SocketContext: Context<SocketContextType | undefined> = createContext<
  SocketContextType | undefined
>(undefined);

interface SocketProviderProps {
  socket: Socket;
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ socket, children }) => {
  const value = useMemo(
    () => ({
      socket,
    }),
    [socket]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);

  if (!context) {
    /** @todo - Handle error */
    throw new Error('useSocket must be used within a SocketProvider');
  }

  return context;
};
