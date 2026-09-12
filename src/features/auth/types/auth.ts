// Auth types aligned with the backend contract:
// - register/login/refresh return { accessToken, refreshToken }
// - GET /auth/me returns { id, email, fullName, isPlatformAdmin, isActive, createdAt, updatedAt }

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  isPlatformAdmin?: boolean;
  roles?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // UI-only fields not guaranteed by the backend; kept optional so existing
  // layouts that read them keep compiling until the real contract provides them.
  avatarUrl?: string;
  companyName?: string;
  company?: string;
  role?: 'ADMIN' | 'ENGINEER' | 'VIEWER' | 'USER';
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
  token: string | null;
}

export interface UserSession {
  id: string;
  device?: string;
  deviceName?: string;
  browser: string;
  os?: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}
