import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService } from '@/features/auth/services/auth.service';
import { apiClient } from '@/services/api/apiClient';
import { tokenStore } from '@/services/api/tokenStore';
import type { AuthState, LoginCredentials, RegisterData, User } from '@/features/auth/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<User | null>;
  register: (data: RegisterData) => Promise<User | null>;
  loginWithGoogle: (idToken: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On load: restore the session if a refresh token exists (FE guideline 03 §8).
  // The access token is in memory only, so a reload must go through refresh.
  useEffect(() => {
    let cancelled = false;

    // If the refresh flow elsewhere fails, drop the local session state.
    apiClient.setAuthFailureHandler(() => {
      setUser(null);
    });

    (async () => {
      const refreshToken = tokenStore.getRefreshToken();
      if (refreshToken) {
        try {
          // Re-issue access token from the persisted refresh token.
          await apiClient.post<{ accessToken: string; refreshToken: string }>(
            '/auth/refresh',
            { refreshToken },
            { auth: false },
          );
          const me = await authService.getCurrentUser();
          if (!cancelled) setUser(me);
        } catch {
          tokenStore.clear();
          if (!cancelled) setUser(null);
        }
      }
      if (!cancelled) setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Returns the logged-in user so the caller (LoginPage) can rely on the
  // resolved value rather than reading context state after an async gap.
  const handleLogin = useCallback(async (credentials: LoginCredentials): Promise<User | null> => {
    setIsLoading(true);
    try {
      const loggedInUser = await authService.login(credentials);
      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRegister = useCallback(async (data: RegisterData): Promise<User | null> => {
    setIsLoading(true);
    try {
      const registeredUser = await authService.register(data);
      setUser(registeredUser);
      return registeredUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoginWithGoogle = useCallback(async (idToken: string): Promise<User | null> => {
    setIsLoading(true);
    try {
      const loggedInUser = await authService.loginWithGoogle(idToken);
      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        token: tokenStore.getAccessToken(),
        login: handleLogin,
        register: handleRegister,
        loginWithGoogle: handleLoginWithGoogle,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AppProviders');
  }
  return context;
};
