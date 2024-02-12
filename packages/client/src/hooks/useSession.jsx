import { createContext, useContext, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useLocalStorage } from "./useLocalStorage";

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const navigate = useNavigate();

  const [session, setSession] = useLocalStorage("session", null);

  // Call this function when you want to authenticate the user
  const saveSession = useCallback(
    async (data) => {
      setSession(data);
    },
    [setSession]
  );

  // call this function to sign out logged in user
  const discardSession = useCallback(async () => {
    setSession(null);
    navigate("/", { replace: true });
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
