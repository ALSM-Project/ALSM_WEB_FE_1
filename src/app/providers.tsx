import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService } from '@/features/auth/services/auth.service';
import { apiClient } from '@/services/api/apiClient';
import { tokenStore } from '@/services/api/tokenStore';
import type { AuthState, LoginCredentials, RegisterData, RegisterResponse, User } from '@/features/auth/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<User | null>;
  register: (data: RegisterData) => Promise<RegisterResponse>;
  verifyEmail: (email: string, code: string) => Promise<User | null>;
  resendVerification: (email: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<User | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


import { NavigationProvider } from '@/context/NavigationContext';

/**
 * Check if a user is an internal staff, sales, or platform admin.
 */
function isUserStaffOrAdmin(u: User | null | undefined): boolean {
  if (!u) return false;
  const roles = u.roles || [];
  return Boolean(
    u.isPlatformAdmin ||
      u.role === 'ADMIN' ||
      roles.includes('ADMIN') ||
      roles.includes('SYSTEM_ADMIN') ||
      roles.includes('TEAM_LEAD') ||
      roles.includes('SALES_REP'),
  );
}

/**
 * Redirect internal staff/sales/admin user from FE1 to FE2 Staff Portal with tokens in URL.
 * Clears FE1 tokens so that on any back-navigation FE1 won't loop.
 */
function redirectAdminToStaffPortal(): void {
  const staffUrl = import.meta.env.VITE_STAFF_PORTAL_URL || 'http://localhost:3002';
  const accessToken = tokenStore.getAccessToken() || '';
  const refreshToken = tokenStore.getRefreshToken() || '';
  if (!accessToken) return;
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

          // Internal Staff / Sales / Admin users: redirect to FE2 Staff Portal.
          if (isUserStaffOrAdmin(me)) {
            redirectAdminToStaffPortal();
            return;
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
    const loggedInUser = await authService.login(credentials);

    // Internal Staff / Sales / Admin users: redirect to FE2 Staff Portal.
    if (isUserStaffOrAdmin(loggedInUser)) {
      redirectAdminToStaffPortal();
      return loggedInUser;
    }

    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const handleRegister = useCallback(async (data: RegisterData): Promise<RegisterResponse> => {
    return authService.register(data);
  }, []);

  const handleVerifyEmail = useCallback(async (email: string, code: string): Promise<User | null> => {
    const verifiedUser = await authService.verifyEmail(email, code);
    if (isUserStaffOrAdmin(verifiedUser)) {
      redirectAdminToStaffPortal();
      return verifiedUser;
    }
    setUser(verifiedUser);
    return verifiedUser;
  }, []);

  const handleResendVerification = useCallback(async (email: string): Promise<void> => {
    await authService.resendVerification(email);
  }, []);

  const handleLoginWithGoogle = useCallback(async (idToken: string): Promise<User | null> => {
    const loggedInUser = await authService.loginWithGoogle(idToken);

    if (isUserStaffOrAdmin(loggedInUser)) {
      redirectAdminToStaffPortal();
      return loggedInUser;
    }

    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const handleLogout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const handleRefreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const me = await authService.getCurrentUser();
      setUser(me);
      return me;
    } catch {
      return null;
    }
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
        verifyEmail: handleVerifyEmail,
        resendVerification: handleResendVerification,
        loginWithGoogle: handleLoginWithGoogle,
        logout: handleLogout,
        refreshUser: handleRefreshUser,
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

