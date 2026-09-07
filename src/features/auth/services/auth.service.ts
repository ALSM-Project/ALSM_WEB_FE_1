import { apiClient } from '@/services/api/apiClient';
import { tokenStore } from '@/services/api/tokenStore';
import type { AuthTokens, LoginCredentials, RegisterData, User } from '../types/auth';

// Auth feature service (FE guideline 04 §7): owns the auth endpoints and maps
// the backend response DTOs. No UI, no routing, no token business here —
// token persistence lives in tokenStore; session state lives in the provider.

// Backend login response may include user data inline (optimization) or
// require a separate GET /auth/me call. We handle both shapes here.
interface AuthTokensWithUser extends AuthTokens {
  user?: User;
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<User | null> {
    const response = await apiClient.post<AuthTokensWithUser>('/auth/login', credentials, { auth: false });
    this.applyTokens(response);
    // If the backend included user inline, use it directly to avoid a round-trip.
    if (response.user) {
      return response.user;
    }
    return this.getCurrentUser();
  }

  async register(data: RegisterData): Promise<User | null> {
    const response = await apiClient.post<AuthTokensWithUser>('/auth/register', data, { auth: false });
    this.applyTokens(response);
    if (response.user) {
      return response.user;
    }
    return this.getCurrentUser();
  }

  async loginWithGoogle(idToken: string): Promise<User | null> {
    const response = await apiClient.post<AuthTokensWithUser>('/auth/google', { idToken }, { auth: false });
    this.applyTokens(response);
    if (response.user) {
      return response.user;
    }
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

  async sendPasswordRecoveryLink(email: string): Promise<void> {
    await apiClient.post<void>('/auth/forgot-password', { email }, { auth: false });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post<void>('/auth/reset-password', { token, newPassword }, { auth: false });
  }

  private applyTokens(tokens: AuthTokens): void {
    tokenStore.setAccessToken(tokens.accessToken);
    tokenStore.setRefreshToken(tokens.refreshToken);
  }
}

export const authService = new AuthService();
