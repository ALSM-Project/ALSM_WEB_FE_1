import { useQuery } from '@tanstack/react-query';
import { accountService } from '../services/account.service';
import { sessionKeys } from './sessionKeys';

export const useActiveSessions = () =>
  useQuery({
    queryKey: sessionKeys.all,
    queryFn: () => accountService.getActiveSessions(),
    staleTime: 30_000,
    retry: false,
  });
