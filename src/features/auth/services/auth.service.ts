import { mockUser } from '@/mocks/auth.mock';
import type { LoginCredentials, RegisterData, User } from '../types/auth';

export class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    console.log('[AuthService] Login with:', credentials.emailOrUsername);
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      ...mockUser,
      email: credentials.emailOrUsername.includes('@') ? credentials.emailOrUsername : mockUser.email,
    };
  }

  async register(data: RegisterData): Promise<User> {
    console.log('[AuthService] Register:', data.workEmail);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      ...mockUser,
      fullName: data.fullName,
      email: data.workEmail,
    };
  }

  async getCurrentUser(): Promise<User | null> {
    return mockUser;
  }

  async logout(): Promise<void> {
    console.log('[AuthService] Logged out');
  }

  async sendPasswordRecoveryLink(email: string): Promise<boolean> {
    console.log('[AuthService] Password recovery requested for:', email);
    await new Promise((resolve) => setTimeout(resolve, 400));
    return true;
  }
}

export const authService = new AuthService();
