import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService } from '@/features/auth/services/auth.service';
import { apiClient } from '@/services/api/apiClient';
import { tokenStore } from '@/services/api/tokenStore';
import type { AuthState, LoginCredentials, RegisterData, RegisterResponse, User } from '@/features/auth/types/auth';

interface AuthContextType extends AuthState {
  token?: string | null;
  login: (credentials: LoginCredentials) => Promise<User | null>;
  register: (data: RegisterData) => Promise<RegisterResponse>;
  verifyEmail: (email: string, code: string) => Promise<User | null>;
  resendVerification: (email: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<User | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


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
  // Never treat platform admins or internal staff as external partners
  if (isUserStaffOrAdmin(u)) return false;
  if (u.hasWeb3Access) return true;
  const roles = (u.roles || []).map((r) => String(r).toUpperCase());
  const role = (u.role || '').toUpperCase();
  // Only explicitly designated enterprise partner roles, NOT regular self-service organization owners
  const partnerRoles = ['PARTNER', 'ENTERPRISE_CUSTOMER', 'ENTERPRISE_ADMIN'];
  return partnerRoles.includes(role) || roles.some((r) => partnerRoles.includes(r));
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
        // If returnTo points to Web 3 (Partner Portal), ONLY redirect if user is legitimately a partner with Web 3 access
        if (returnTo.includes('3003') || returnTo.includes('web3')) {
          if (isUserPartner(u) || u.hasWeb3Access) {
            return returnTo;
          }
          // Standard customer or staff without Web 3 access must NOT be bounced to Web 3!
          return null;
        }

        // If returnTo points to Web 2 (Staff Portal), ONLY redirect if user is staff/admin
        if (returnTo.includes('3002') || returnTo.includes('staff')) {
          if (isUserStaffOrAdmin(u)) {
            return returnTo;
          }
          return null;
        }

        return returnTo;
      }
    } catch {
      // Ignore if URLSearchParams is unavailable
    }
  }

  // 2. Internal staff / admin -> redirect to Web 2 (Staff Portal takes absolute priority for internal staff)
  if (isUserStaffOrAdmin(u)) {
    const staffUrl = import.meta.env.VITE_STAFF_PORTAL_URL || "http://localhost:3002";
    return `${staffUrl}/auth/callback`;
  }

  // 3. PARTNER role or has Web 3 access -> redirect to Web 3
  if (isUserPartner(u) || u.hasWeb3Access) {
    const web3Url = import.meta.env.VITE_WEB3_PORTAL_URL || "http://localhost:3003";
    return `${web3Url}/auth/callback`;
  }

  return null;
}

/**
 * Redirect user from FE1 to target portal (FE2 or FE3) with token handoff.
 * Clears FE1 tokens so that on any back-navigation FE1 won't loop.
 * For Web 3, passes tokens in URL hash fragment so secrets never enter query strings or server logs.
 */
export async function redirectUserToPortal(targetUrl?: string | null): Promise<void> {
  const staffUrl = import.meta.env.VITE_STAFF_PORTAL_URL || "http://localhost:3002";
  const target = targetUrl || `${staffUrl}/auth/callback`;
  await tokenStore.handoff(({ accessToken, refreshToken }) => {
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
      await redirectAdminToStaffPortal(targetHandoff);
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
      await redirectAdminToStaffPortal(targetHandoff);
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
      await redirectUserToPortal(targetHandoff);
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
      try {
        await authService.logout();
      } catch (err) {
        console.warn('Backend session revocation failed, proceeding with client cleanup:', err);
      }
    } finally {
      tokenStore.clear();
      setUser(null);
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
        error: null,
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

