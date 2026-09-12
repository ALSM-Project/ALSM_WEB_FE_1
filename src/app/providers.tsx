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

import { NavigationProvider } from '@/context/NavigationContext';

/**
 * Check if a user is a platform admin.
 */
function isUserAdmin(u: User | null | undefined): boolean {
  if (!u) return false;
  return Boolean(u.isPlatformAdmin || u.role === 'ADMIN' || u.roles?.includes('ADMIN'));
}

/**
 * Redirect admin user from FE1 to FE2 Staff Portal with tokens in URL.
 * Clears FE1 tokens so that on any back-navigation FE1 won't loop.
 */
function redirectAdminToStaffPortal(): void {
  const staffUrl = import.meta.env.VITE_STAFF_PORTAL_URL || 'http://localhost:3002';
  const accessToken = tokenStore.getAccessToken() || '';
  const refreshToken = tokenStore.getRefreshToken() || '';
  // Clear tokens from FE1 so returning here doesn't trigger another redirect loop
  tokenStore.clear();
  window.location.href = `${staffUrl}/auth/callback?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
}

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On load: restore the session if a refresh token exists.
  useEffect(() => {
    let cancelled = false;

    apiClient.setAuthFailureHandler(() => {
      setUser(null);
    });

    (async () => {
      const refreshToken = tokenStore.getRefreshToken();
      if (refreshToken) {
        try {
          const tokens = await apiClient.post<{ accessToken: string; refreshToken: string }>(
            '/auth/refresh',
            { refreshToken },
            { auth: false },
          );
          tokenStore.setAccessToken(tokens.accessToken);
          tokenStore.setRefreshToken(tokens.refreshToken);
          const me = await authService.getCurrentUser();

          // If the restored session belongs to an admin, redirect to FE2 immediately.
          // Do NOT call setUser() — this prevents GuestRoute from interfering.
          if (isUserAdmin(me)) {
            redirectAdminToStaffPortal();
            return; // Don't setIsLoading(false); page is navigating away
          }

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

  const handleLogin = useCallback(async (credentials: LoginCredentials): Promise<User | null> => {
    setIsLoading(true);
    try {
      const loggedInUser = await authService.login(credentials);

      // Admin users: redirect to FE2 immediately. Don't call setUser().
      if (isUserAdmin(loggedInUser)) {
        redirectAdminToStaffPortal();
        // Keep isLoading=true so GuestRoute shows spinner while browser navigates
        return loggedInUser;
      }

      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      // For non-admin users, clear loading. For admin, we intentionally
      // keep isLoading=true so the page shows a spinner until navigation completes.
      // We check user state: if user was set, loading should end.
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

      // Admin users: redirect to FE2 immediately
      if (isUserAdmin(loggedInUser)) {
        redirectAdminToStaffPortal();
        return loggedInUser;
      }

      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      setIsLoading(false);
      throw err;
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
      <NavigationProvider>{children}</NavigationProvider>
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

