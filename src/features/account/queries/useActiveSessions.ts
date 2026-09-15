import { useQuery } from '@tanstack/react-query';
import { accountService } from '../services/account.service';
import { sessionKeys } from './sessionKeys';

export const useActiveSessions = (userId?: string) =>
  useQuery({
    queryKey: userId ? sessionKeys.byUser(userId) : sessionKeys.root,
    queryFn: () => accountService.getActiveSessions(),
    staleTime: 30_000,
    retry: false,
    enabled: Boolean(userId),
    refetchOnMount: 'always',
  });
