import { createContext, useContext, useMemo } from "react";

const SocketContext = createContext();

export const SocketProvider = ({ socket, children }) => {
  const value = useMemo(
    () => ({
      socket,
    }),
    [socket]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
