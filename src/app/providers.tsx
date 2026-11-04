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
export function isUserStaffOrAdmin(u: User | null | undefined): boolean {
  if (!u) return false;
  const roles = (u.roles || []).map((r) => String(r).toUpperCase());
  const role = (u.role || '').toUpperCase();
  const internalRoles = [
    'ADMIN',
    'SYSTEM_ADMIN',
    'TEAM_LEAD',
    'CONVERSION_STAFF',
    'SALES_MANAGER',
    'INTERNAL_SALES',
    'INTERNAL_SUPPORT',
    'SALES_REP',
  ];

  return Boolean(
    u.isPlatformAdmin ||
      internalRoles.includes(role) ||
      roles.some((r) => internalRoles.includes(r)),
  );
}

/**
 * Check if a user is an external partner organization representative.
 */
export function isUserPartner(u: User | null | undefined): boolean {
  if (!u) return false;
  const roles = (u.roles || []).map((r) => String(r).toUpperCase());
  const role = (u.role || '').toUpperCase();
  return role === 'PARTNER' || roles.includes('PARTNER');
}

/**
 * Determine target portal URL for token handoff.
 * Supports:
 * 1. returnTo query param (e.g. from Web 3 http://localhost:3003/auth/callback)
 * 2. PARTNER role default -> Web 3 (VITE_WEB3_PORTAL_URL || http://localhost:3003/auth/callback)
 * 3. Staff/Admin roles -> Web 2 Staff Portal (VITE_STAFF_PORTAL_URL || http://localhost:3002/auth/callback)
 */
export function getTargetHandoffUrl(u: User | null | undefined): string | null {
  if (!u) return null;

  // 1. Check if returnTo query parameter is in URL
  if (typeof window !== "undefined" && window.location) {
    try {
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo");
      if (returnTo && (returnTo.startsWith("http://") || returnTo.startsWith("https://"))) {
        return returnTo;
      }
    } catch {
      // Ignore if URLSearchParams is unavailable
    }
  }

  // 2. PARTNER role -> redirect to Web 3
  if (isUserPartner(u)) {
    const web3Url = import.meta.env.VITE_WEB3_PORTAL_URL || "http://localhost:3003";
    return `${web3Url}/auth/callback`;
  }

  // 3. Internal staff / admin -> redirect to Web 2
  if (isUserStaffOrAdmin(u)) {
    const staffUrl = import.meta.env.VITE_STAFF_PORTAL_URL || "http://localhost:3002";
    return `${staffUrl}/auth/callback`;
  }

  return null;
}

/**
 * Redirect user from FE1 to target portal (FE2 or FE3) with token handoff.
 * Clears FE1 tokens so that on any back-navigation FE1 won't loop.
 * For Web 3, passes tokens in URL hash fragment so secrets never enter query strings or server logs.
 */
export function redirectUserToPortal(targetUrl?: string | null): void {
  const staffUrl = import.meta.env.VITE_STAFF_PORTAL_URL || "http://localhost:3002";
  const target = targetUrl || `${staffUrl}/auth/callback`;
  void tokenStore.handoff(({ accessToken, refreshToken }) => {
    if (target.includes('3003') || target.includes('web3')) {
      window.location.href = `${target}#access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
    } else {
      const separator = target.includes("?") ? "&" : "?";
      window.location.href = `${target}${separator}access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
    }
  });
}

const redirectAdminToStaffPortal = redirectUserToPortal;


export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On load: restore the session if a refresh token exists.
  useEffect(() => {
    let cancelled = false;

    apiClient.setAuthFailureHandler(() => {
      setUser(null);
    });

    const epoch = tokenStore.epoch();
    const unsubscribe = tokenStore.subscribe(() => {
      if (!tokenStore.getRefreshToken() && !tokenStore.isLogoutPending()) setUser(null);
      if (tokenStore.requiresPasswordChange()) {
        const currentEpoch = tokenStore.epoch();
        void authService.getCurrentUser().then((restricted) => {
          if (!cancelled && currentEpoch === tokenStore.epoch() && tokenStore.requiresPasswordChange()) {
            setUser(restricted);
            setIsLoading(false);
          }
        }).catch(() => {});
      }
    });

    (async () => {
      const refreshToken = tokenStore.getRefreshToken();
      if (refreshToken) {
        try {
          const tokens = await apiClient.refreshSession();
          if (!tokens || cancelled || epoch !== tokenStore.epoch() || !tokenStore.getRefreshToken()) return;
          const me = await authService.getCurrentUser();
          if (cancelled || epoch !== tokenStore.epoch() || !tokenStore.getRefreshToken()) return;

          // Internal Staff / Sales / Admin users: redirect to FE2 Staff Portal.
          const targetHandoff = getTargetHandoffUrl(me);
          if (targetHandoff) {
            redirectAdminToStaffPortal(targetHandoff);
            return;
          }

          if (!cancelled) setUser(me);
        } catch {
          if (!cancelled && epoch === tokenStore.epoch()) setUser(null);
        }
      }
    })().finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const handleLogin = useCallback(async (credentials: LoginCredentials): Promise<User | null> => {
    const loggedInUser = await authService.login(credentials);

    // Internal Staff / Sales / Admin users: redirect to FE2 Staff Portal.
    const targetHandoff = getTargetHandoffUrl(loggedInUser);
    if (targetHandoff) {
      redirectAdminToStaffPortal(targetHandoff);
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
    const targetHandoff = getTargetHandoffUrl(verifiedUser);
    if (targetHandoff) {
      redirectAdminToStaffPortal(targetHandoff);
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

    const targetHandoff = getTargetHandoffUrl(loggedInUser);
    if (targetHandoff) {
      redirectUserToPortal(targetHandoff);
      return loggedInUser;
    }

    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id?.disableAutoSelect) {
        try {
          (window as any).google.accounts.id.disableAutoSelect();
        } catch {
          // ignore
        }
      }
      await authService.logout();
      setUser(null);
    } catch (error) {
      window.alert('Sign out could not be confirmed. Please try Sign Out again.');
      throw error;
    }
  }, []);

  const handleRefreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const me = await authService.getCurrentUser();
      setUser(me);
      const targetHandoff = getTargetHandoffUrl(me);
      if (targetHandoff) redirectUserToPortal(targetHandoff);
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

      {user?.mustChangePassword ? children : <NavigationProvider>{children}</NavigationProvider>}
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

