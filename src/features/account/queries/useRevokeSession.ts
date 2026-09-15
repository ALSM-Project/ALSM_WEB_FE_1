import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../services/account.service';
import { sessionKeys } from './sessionKeys';

export const useRevokeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => accountService.revokeSession(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
  });
};
