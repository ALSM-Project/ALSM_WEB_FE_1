import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../services/account.service';
import { sessionKeys } from './sessionKeys';

export const useRevokeAllOtherSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => accountService.revokeAllOtherSessions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
  });
};
