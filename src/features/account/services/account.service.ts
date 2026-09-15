import { apiClient } from '@/services/api/apiClient';
import type { ActiveSession, PasswordChangeData } from '../types/account';

export class AccountService {
  async setPassword(newPassword: string): Promise<void> {
    await apiClient.post<void>('/auth/set-password', { newPassword });
  }

  async changePassword(data: PasswordChangeData): Promise<void> {
    await apiClient.post<void>('/auth/change-password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  }

  async setup2FA(): Promise<{ qrCodeDataUrl?: string; qrCodeUrl?: string; secretKey?: string; otpauthUri?: string }> {
    const res = await apiClient.post<{ enabled: boolean; otpauthUri?: string; qrCodeDataUrl?: string; qrCodeUrl?: string; secretKey?: string }>('/auth/2fa/setup');
    let secretKey = res.secretKey || '';
    if (!secretKey && res.otpauthUri) {
      const match = /[?&]secret=([^&]+)/i.exec(res.otpauthUri);
      if (match) secretKey = match[1];
    }
    const qr = res.qrCodeDataUrl || res.qrCodeUrl;
    return {
      qrCodeDataUrl: qr,
      qrCodeUrl: qr,
      secretKey,
      otpauthUri: res.otpauthUri,
    };
  }


  async confirm2FA(code: string): Promise<{ enabled: boolean; backupCodes?: string[] }> {
    return apiClient.post<{ enabled: boolean; backupCodes?: string[] }>('/auth/2fa/confirm', {
      code,
    });
  }

  async verify2FA(otpCode: string): Promise<boolean> {
    try {
      const res = await this.confirm2FA(otpCode);
      return res.enabled;
    } catch {
      return false;
    }
  }

  async getActiveSessions(): Promise<ActiveSession[]> {
    const res = await apiClient.get<ActiveSession[]>('/auth/sessions');
    return res || [];
  }

  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete<void>(`/auth/sessions/${sessionId}`);
  }

}

export const accountService = new AccountService();

