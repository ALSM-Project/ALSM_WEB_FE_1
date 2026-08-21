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
