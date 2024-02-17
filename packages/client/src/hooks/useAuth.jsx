import { createContext, useContext, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useLocalStorage } from "./useLocalStorage";
import { navigateHome, navigateDashboard } from "../utils";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useLocalStorage("user", null);

  // Call this function when you want to authenticate the user
  const login = useCallback(
    (data) => {
      setUser(data);
      navigateDashboard(navigate);
    },
    [navigate, setUser]
  );

  // call this function to sign out logged in user
  const logout = useCallback(() => {
    setUser(null);
    navigateHome(navigate);
  }, [navigate, setUser]);

  const updateUser = useCallback(
    (value) => {
      setUser(value);
    },
    [setUser]
  );

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      updateUser,
    }),
    [login, logout, user, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
