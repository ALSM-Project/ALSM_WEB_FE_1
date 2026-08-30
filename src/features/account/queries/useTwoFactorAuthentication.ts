import { useMutation } from '@tanstack/react-query';
import { accountService } from '../services/account.service';
import type { ConfirmMfaSetupRequest } from '../types/account';

export const useTwoFactorAuthentication = () => {
  const setupMutation = useMutation({
    mutationFn: () => accountService.startMfaSetup(),
    retry: false,
    // Setup responses contain provisioning material; remove completed mutations immediately on reset.
    gcTime: 0,
  });

  const confirmMutation = useMutation({
    mutationFn: (data: ConfirmMfaSetupRequest) =>
      accountService.confirmMfaSetup(data),
    retry: false,
    // Confirmation variables and responses contain OTP/recovery material.
    gcTime: 0,
  });

  return { setupMutation, confirmMutation };
};
