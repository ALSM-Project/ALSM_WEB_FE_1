import { apiClient } from '@/services/api/apiClient';
import { tokenStore } from '@/services/api/tokenStore';
import type { AuthTokens, LoginCredentials, RegisterData, RegisterResponse, User } from '../types/auth';

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
    const response = await tokenStore.authenticate(() => apiClient.post<AuthTokensWithUser>('/auth/login', credentials, { auth: false }));
    if (response.mustChangePassword) return this.getCurrentUser();
    if (response.user) {
      return response.user;
    }
    return this.getCurrentUser();
  }

  async register(data: RegisterData): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/auth/register', data, { auth: false });
  }

  async verifyEmail(email: string, code: string): Promise<User | null> {
    const response = await tokenStore.authenticate(() => apiClient.post<AuthTokensWithUser>('/auth/verify-email', { email, code }, { auth: false }));
    if (response.mustChangePassword) return this.getCurrentUser();
    if (response.user) {
      return response.user;
    }
    return this.getCurrentUser();
  }

  async resendVerification(email: string): Promise<void> {
    await apiClient.post<{ ok: true }>('/auth/resend-verification', { email }, { auth: false });
  }

  async loginWithGoogle(idToken: string): Promise<User | null> {
    const response = await tokenStore.authenticate(() => apiClient.post<AuthTokensWithUser>('/auth/google', { idToken }, { auth: false }));
    if (response.mustChangePassword) return this.getCurrentUser();
    if (response.user) {
      return response.user;
    }
    return this.getCurrentUser();
  }

  async getCurrentUser(): Promise<User | null> {
    if (tokenStore.requiresPasswordChange()) {
      const payload = JSON.parse(atob((tokenStore.getAccessToken() || '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return { id: payload.sub, email: payload.email, fullName: payload.email,
        mustChangePassword: true, hasPassword: tokenStore.hasPassword(), roles: [], isPlatformAdmin: false };
    }
    const epoch = tokenStore.epoch();
    try {
      const user = await apiClient.get<User>('/auth/me');
      if (epoch !== tokenStore.epoch() || !tokenStore.getAccessToken()) throw new Error('Authentication was superseded');
      return user;
    } catch (error) {
      if ((error as { status?: number }).status === 401) return null;
      throw error;
    }
  }

  async logout(): Promise<void> {
    await tokenStore.logout(async (refreshToken) => {
      await apiClient.post<void>('/auth/logout', { refreshToken }, { auth: false });
    });
  }

  async sendPasswordRecoveryLink(email: string): Promise<void> {
    await apiClient.post<void>('/auth/forgot-password', { email }, { auth: false });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post<void>('/auth/reset-password', { token, newPassword }, { auth: false });
  }

}

export const authService = new AuthService();
