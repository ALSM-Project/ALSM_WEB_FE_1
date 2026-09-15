import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../services/account.service';
import { sessionKeys } from './sessionKeys';

export const useRevokeSession = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => accountService.revokeSession(sessionId),
    onSuccess: () => {
      if (userId) {
        return queryClient.invalidateQueries({ queryKey: sessionKeys.byUser(userId) });
      }
      return undefined;
    },
  });
};
