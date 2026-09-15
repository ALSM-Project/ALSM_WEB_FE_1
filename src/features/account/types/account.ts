export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  acknowledgeLogout: boolean;
}

export interface TwoFactorState {
  enabled: boolean;
  step: 1 | 2 | 3;
  secretKey: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  activeSessionsCount: number;
  lastPasswordChange: string;
}

/** Session data returned by GET /api/v1/auth/sessions. */
export interface ActiveSession {
  id: string;
  deviceType: string;
  browser: string;
  lastActiveAt: string;
  createdAt: string;
  expiresAt: string;
}
