// Auth types aligned with the backend contract:
// - register/login/refresh return { accessToken, refreshToken }
// - GET /auth/me returns { id, email, fullName, isPlatformAdmin, isActive, createdAt, updatedAt }

export interface AuthTokens {
  mustChangePassword?: boolean;
  hasPassword?: boolean;
  accessToken: string;
  refreshToken: string;
}

export interface MfaChallengeResponse {
  requiresTwoFactor: true;
  mfaToken: string;
}

export type LoginResult = User | MfaChallengeResponse | null;

export function isMfaChallenge(result: unknown): result is MfaChallengeResponse {
  return Boolean(
    result &&
      typeof result === 'object' &&
      'requiresTwoFactor' in result &&
      (result as MfaChallengeResponse).requiresTwoFactor === true &&
      typeof (result as MfaChallengeResponse).mfaToken === 'string',
  );
}

export interface RegisterResponse {
  requiresEmailVerification: boolean;
  email: string;
  message: string;
}

export interface User {
  mustChangePassword?: boolean;
  id: string;
  email: string;
  fullName: string;
  isPlatformAdmin?: boolean;
  hasWeb3Access?: boolean;
  roles?: string[];
  isActive?: boolean;
  hasPassword?: boolean;
  twoFactorEnabled?: boolean;
  providers?: ('GOOGLE' | 'PASSWORD')[];
  createdAt?: string;
  updatedAt?: string;
  // UI-only fields not guaranteed by the backend; kept optional so existing
  // layouts that read them keep compiling until the real contract provides them.
  avatarUrl?: string;
  companyName?: string;
  company?: string;
  organizationId?: string;
  organizationName?: string;
  role?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
