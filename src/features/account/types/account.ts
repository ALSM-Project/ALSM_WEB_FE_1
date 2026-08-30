export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  acknowledgeLogout: boolean;
}

export interface StartMfaSetupResponse {
  enabled: false;
  otpauthUri: string;
  qrCodeDataUrl: string;
}

export interface ConfirmMfaSetupRequest {
  code: string;
}

export interface ConfirmMfaSetupResponse {
  enabled: true;
  backupCodes: string[];
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  activeSessionsCount: number;
  lastPasswordChange: string;
}
