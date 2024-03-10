import React, {
  type ReactNode,
  type Context,
  createContext,
  useContext,
  useMemo,
  useCallback,
} from "react";

import { useLocalStorage } from "./useLocalStorage";

type SessionIdType = string | null;

type SessionProviderProps = {
  children: ReactNode;
};

type SessionContextType = {
  sessionId: SessionIdType;
  updateSessionId: (data: SessionIdType) => void;
  discardSessionId: () => void;
};

// Create a context with a default empty value.
const SessionContext: Context<SessionContextType | undefined> = createContext<
  SessionContextType | undefined
>(undefined);

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
}) => {
  const [sessionId, setSessionId] = useLocalStorage<SessionIdType>(
    "session",
    null
  );

  // Call this function when you want to authenticate the user
  const updateSessionId = useCallback(
    (data: SessionIdType) => {
      setSessionId(data);
    },
    [setSessionId]
  );

  // Call this function when server sessionId expires
  const discardSessionId = useCallback(() => {
    setSessionId(null);
  }, [setSessionId]);

  const value = useMemo(
    () => ({
      sessionId,
      updateSessionId,
      discardSessionId,
    }),
    [updateSessionId, discardSessionId, sessionId]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);

  if (context === undefined) {
    /** @todo - Handle error */
    throw new Error("useSession must be used within a SessionProvider.");
  }

  return context;
};
