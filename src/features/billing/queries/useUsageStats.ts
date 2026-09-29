import { useQuery } from '@tanstack/react-query';
import { billingService } from '../services/billing.service';

export const usageStatsKeys = {
  all: ['billing', 'usage'] as const,
};

export function useUsageStats() {
  return useQuery({
    queryKey: usageStatsKeys.all,
    queryFn: () => billingService.getUsageStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    retry: 1,
  });
}
