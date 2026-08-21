export interface User {
  id: string;
  fullName: string;
  email: string;
  companyName?: string;
  company?: string;
  role: 'ADMIN' | 'ENGINEER' | 'VIEWER' | 'USER';
  avatarUrl?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  emailOrUsername: string;
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  fullName: string;
  workEmail: string;
  companyName: string;
  agreedToTerms: boolean;
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
