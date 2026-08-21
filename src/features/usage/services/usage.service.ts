import { mockUsageStats } from '@/mocks/billing.mock';
import type { UsageStatistics } from '@/features/billing/types/billing';

export class UsageService {
  async getUsageStats(): Promise<UsageStatistics> {
    return mockUsageStats;
  }
}

export const usageService = new UsageService();
