import React, { createContext, useContext, useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { authService } from '@/features/auth/services/auth.service';
import { apiClient } from '@/services/api/apiClient';
import { tokenStore } from '@/services/api/tokenStore';
import type { AuthState, LoginCredentials, RegisterData, User } from '@/features/auth/types/auth';
import { queryClient } from './queryClient';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
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

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      setUser(await authService.login(credentials));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      setUser(await authService.register(data));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithGoogle = async (idToken: string) => {
    setIsLoading(true);
    try {
      setUser(await authService.loginWithGoogle(idToken));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AppProviders');
  }
  return context;
};
