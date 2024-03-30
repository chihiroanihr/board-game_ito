import React, {
  type ReactNode,
  type Context,
  createContext,
  useContext,
  useMemo,
  useCallback,
} from 'react';

import type { User } from '@bgi/shared';

import { useLocalStorage } from './useLocalStorage';

type UserDataType = User | null;

type AuthProviderProps = {
  children: ReactNode;
};

type AuthContextType = {
  user: UserDataType;
  updateUser: (data: UserDataType) => void;
  discardUser: () => void;
};

// Create a context with a default empty value.
const AuthContext: Context<AuthContextType | undefined> = createContext<
  AuthContextType | undefined
>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useLocalStorage<UserDataType>('user', null);

  // Call this function when you want to authenticate the user

  // Call this function to sign out logged in user
  const discardUser = useCallback(() => {
    setUser(null);
  }, [setUser]);

  // Call this function to authenticate / update the user info
  const updateUser = useCallback(
    (data: UserDataType) => {
      setUser(data);
    },
    [setUser]
  );

  const value = useMemo(
    () => ({
      user,
      discardUser,
      updateUser,
    }),
    [discardUser, user, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    /** @todo - Handle error */
    throw new Error('useAuth() hook must be used within a <AuthProvider />.');
  }

  return context;
};
