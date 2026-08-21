import {
  mockCurrentSubscription,
  mockInvoices,
  mockQRDetails,
  mockSubscriptionPlans,
  mockUsageStats,
} from '@/mocks/billing.mock';
import type { Invoice, QRDetails, Subscription, SubscriptionPlan, UsageStatistics } from '../types/billing';

export class BillingService {
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return mockSubscriptionPlans;
  }

  async getCurrentSubscription(): Promise<Subscription> {
    return mockCurrentSubscription;
  }

  async getInvoices(): Promise<Invoice[]> {
    return mockInvoices;
  }

  async getQRDetails(): Promise<QRDetails> {
    return mockQRDetails;
  }

  async getUsageStats(): Promise<UsageStatistics> {
    return mockUsageStats;
  }

  async cancelSubscription(reason: string, feedback?: string): Promise<boolean> {
    console.log('[BillingService] Subscription cancellation requested:', { reason, feedback });
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  }

  async upgradePlan(targetPlanId: string): Promise<boolean> {
    console.log('[BillingService] Upgrade plan to:', targetPlanId);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return true;
  }
}

export const billingService = new BillingService();
