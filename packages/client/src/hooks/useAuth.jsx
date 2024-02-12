import { createContext, useContext, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useLocalStorage } from "./useLocalStorage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useLocalStorage("user", null);

  // Call this function when you want to authenticate the user
  const login = useCallback(
    async (data) => {
      setUser(data);
      navigate("/dashboard");
    },
    [navigate, setUser]
  );

  // call this function to sign out logged in user
  const logout = useCallback(async () => {
    setUser(null);
    navigate("/", { replace: true });
  }, [navigate, setUser]);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
    }),
    [login, logout, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
