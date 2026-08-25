import { apiClient } from '@/services/api/apiClient';
import { tokenStore } from '@/services/api/tokenStore';
import type { AuthTokens, LoginCredentials, RegisterData, User } from '../types/auth';

// Auth feature service (FE guideline 04 §7): owns the auth endpoints and maps
// the backend response DTOs. No UI, no routing, no token business here —
// token persistence lives in tokenStore; session state lives in the provider.

export class AuthService {
  async login(credentials: LoginCredentials): Promise<User | null> {
    const tokens = await apiClient.post<AuthTokens>('/auth/login', credentials, { auth: false });
    this.applyTokens(tokens);
    return this.getCurrentUser();
  }

  async register(data: RegisterData): Promise<User | null> {
    const tokens = await apiClient.post<AuthTokens>('/auth/register', data, { auth: false });
    this.applyTokens(tokens);
    return this.getCurrentUser();
  }

  async loginWithGoogle(idToken: string): Promise<User | null> {
    const tokens = await apiClient.post<AuthTokens>('/auth/google', { idToken }, { auth: false });
    this.applyTokens(tokens);
    return this.getCurrentUser();
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      return await apiClient.get<User>('/auth/me');
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    const refreshToken = tokenStore.getRefreshToken();
    try {
      if (refreshToken) {
        await apiClient.post<void>('/auth/logout', { refreshToken }, { auth: false });
      }
    } finally {
      tokenStore.clear();
    }
  }

  async sendPasswordRecoveryLink(email: string): Promise<boolean> {
    // Not yet exposed by the backend auth module; kept as a stub so callers
    // (PasswordRecoveryPage) keep a stable interface.
    void email;
    return true;
  }

  private applyTokens(tokens: AuthTokens): void {
    tokenStore.setAccessToken(tokens.accessToken);
    tokenStore.setRefreshToken(tokens.refreshToken);
  }
}

export const authService = new AuthService();
