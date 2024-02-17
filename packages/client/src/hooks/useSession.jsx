import { createContext, useContext, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useLocalStorage } from "./useLocalStorage";
import { navigateHome } from "../utils";

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const navigate = useNavigate();

  const [session, setSession] = useLocalStorage("session", null);

  // Call this function when you want to authenticate the user
  const saveSession = useCallback(
    (data) => {
      setSession(data);
    },
    [setSession]
  );

  // Call this function when server session expires
  const discardSession = useCallback(() => {
    setSession(null);
    navigateHome(navigate);
  }, [navigate, setSession]);

  const value = useMemo(
    () => ({
      session,
      saveSession,
      discardSession,
    }),
    [saveSession, discardSession, session]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export const useSession = () => {
  return useContext(SessionContext);
};
