import { apiClient } from '@/services/api/apiClient';

export interface PhoneOtpRequestedResponse {
  sent: boolean;
  retryAfterSeconds: number;
}

export interface PhoneOtpVerifiedResponse {
  verified: boolean;
}

export interface PhoneVerificationStatusResponse {
  status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED';
  phone?: string;
}

export const phoneVerificationService = {
  requestOtp: (phone: string) =>
    apiClient.post<PhoneOtpRequestedResponse>('/auth/phone/request-otp', { phone }),

  verifyOtp: (phone: string, code: string) =>
    apiClient.post<PhoneOtpVerifiedResponse>('/auth/phone/verify-otp', { phone, code }),

  getStatus: () =>
    apiClient.get<PhoneVerificationStatusResponse>('/auth/phone/status'),
};

