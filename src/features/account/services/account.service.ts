import { mockSessions } from '@/mocks/sessions.mock';
import type { PasswordChangeData } from '../types/account';
import type { UserSession } from '@/features/auth/types/auth';

export class AccountService {
  private sessions: UserSession[] = [...mockSessions];

  async changePassword(_data: PasswordChangeData): Promise<boolean> {
    console.log('[AccountService] Change password executed');
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  }

  async verify2FA(otpCode: string): Promise<boolean> {
    console.log('[AccountService] Verify 2FA OTP:', otpCode);
    await new Promise((resolve) => setTimeout(resolve, 400));
    return otpCode.length === 6;
  }

  async getActiveSessions(): Promise<UserSession[]> {
    return [...this.sessions];
  }

  async revokeSession(sessionId: string): Promise<UserSession[]> {
    this.sessions = this.sessions.filter((s) => s.id !== sessionId || s.isCurrent);
    return [...this.sessions];
  }

  async revokeAllOtherSessions(): Promise<UserSession[]> {
    this.sessions = this.sessions.filter((s) => s.isCurrent);
    return [...this.sessions];
  }
}

export const accountService = new AccountService();
