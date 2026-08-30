import { mockSessions } from '@/mocks/sessions.mock';
import { apiClient } from '@/services/api/apiClient';
import type {
  ConfirmMfaSetupRequest,
  ConfirmMfaSetupResponse,
  PasswordChangeData,
  StartMfaSetupResponse,
} from '../types/account';
import type { UserSession } from '@/features/auth/types/auth';

export class AccountService {
  private sessions: UserSession[] = [...mockSessions];

  async changePassword(data: PasswordChangeData): Promise<void> {
    await apiClient.post<void>('/auth/change-password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  }

  async startMfaSetup(): Promise<StartMfaSetupResponse> {
    return apiClient.post<StartMfaSetupResponse>('/auth/2fa/setup');
  }

  async confirmMfaSetup(
    data: ConfirmMfaSetupRequest,
  ): Promise<ConfirmMfaSetupResponse> {
    return apiClient.post<ConfirmMfaSetupResponse>('/auth/2fa/confirm', data);
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
