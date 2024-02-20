import React, {
  ReactNode,
  Context,
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
  updateSession: (data: SessionIdType) => void;
  discardSession: () => void;
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
  const updateSession = useCallback(
    (data: SessionIdType) => {
      setSessionId(data);
    },
    [setSessionId]
  );

  // Call this function when server sessionId expires
  const discardSession = useCallback(() => {
    setSessionId(null);
  }, [setSessionId]);

  const value = useMemo(
    () => ({
      sessionId,
      updateSession,
      discardSession,
    }),
    [updateSession, discardSession, sessionId]
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
