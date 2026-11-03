import { useQuery } from '@tanstack/react-query';
import { navigationApi } from '../api/navigation.api';
import type { BackendNavItem } from '../api/navigation.api';

export const useNavigationQuery = (application: string = 'WEB_1', enabled: boolean = true) => {
  return useQuery<BackendNavItem[]>({
    queryKey: ['navigation', application],
    queryFn: () => navigationApi.getNavigation(application),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes cache to prevent aggressive spamming
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

export type { BackendNavItem };
