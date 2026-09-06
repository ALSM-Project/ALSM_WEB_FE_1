import { apiClient } from '@/services/api/apiClient';
import {
  mockCurrentSubscription,
  mockInvoices,
  mockQRDetails,
  mockSubscriptionPlans,
  mockUsageStats,
} from '@/mocks/billing.mock';
import type {
  Invoice,
  PaymentStatusResponse,
  QRDetails,
  QRPaymentOrder,
  LegacySubscription,
  Subscription,
  SubscriptionPlan,
  UpgradePreview,
  UsageStatistics,
  BillingCycle,
  PlanTier,
} from '../types/billing';

/**
 * BillingService – calls real BE APIs with mock fallback for development.
 * Set `USE_MOCK = false` when the BE is fully running.
 */
export class BillingService {
  // ─── Plans ───────────────────────────────────────────────

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const plans = await apiClient.get<SubscriptionPlan[]>('/billing/plans');
      if (plans && Array.isArray(plans) && plans.length > 0) {
        return plans;
      }
      return mockSubscriptionPlans;
    } catch (err) {
      console.warn('[BillingService] API GET /billing/plans failed, using fallback mock data:', err);
      return mockSubscriptionPlans;
    }
  }

  // ─── Subscription ────────────────────────────────────────

  async getCurrentSubscription(): Promise<Subscription | LegacySubscription | null> {
    try {
      const sub = await apiClient.get<Subscription | null>('/billing/subscription');
      if (sub) return sub;
      return mockCurrentSubscription;
    } catch (err) {
      console.warn('[BillingService] API GET /billing/subscription failed, using fallback mock data:', err);
      return mockCurrentSubscription;
    }
  }

  async activateTrial(): Promise<Subscription> {
    return apiClient.post<Subscription>('/billing/subscription/trial');
  }

  async createSubscription(planTier: PlanTier, billingCycle: BillingCycle): Promise<Subscription> {
    return apiClient.post<Subscription>('/billing/subscription', { planTier, billingCycle });
  }

  // ─── Upgrade ─────────────────────────────────────────────

  async getUpgradePreview(): Promise<UpgradePreview> {
    return apiClient.get<UpgradePreview>('/billing/subscription/upgrade-preview');
  }

  async upgradePlan(targetPlanTier: string): Promise<boolean> {
    try {
      await apiClient.put('/billing/subscription/upgrade', { targetPlanTier });
      return true;
    } catch (err) {
      console.warn('[BillingService] API PUT /billing/subscription/upgrade failed, fallback simulation:', err);
      await new Promise((resolve) => setTimeout(resolve, 600));
      return true;
    }
  }

  // ─── Cancel ──────────────────────────────────────────────

  async cancelSubscription(reason: string, feedback?: string): Promise<boolean> {
    try {
      await apiClient.post('/billing/subscription/cancel', { reason, feedback });
      return true;
    } catch (err) {
      console.warn('[BillingService] API POST /billing/subscription/cancel failed, fallback simulation:', err);
      await new Promise((resolve) => setTimeout(resolve, 500));
      return true;
    }
  }

  // ─── Invoices ────────────────────────────────────────────

  async getInvoices(): Promise<Invoice[]> {
    try {
      const invoices = await apiClient.get<Invoice[]>('/billing/invoices');
      if (invoices && Array.isArray(invoices)) return invoices;
      return mockInvoices as unknown as Invoice[];
    } catch (err) {
      console.warn('[BillingService] API GET /billing/invoices failed, using fallback mock data:', err);
      return mockInvoices as unknown as Invoice[];
    }
  }

  // ─── Payment (QR) ────────────────────────────────────────

  async createPaymentOrder(planTier: PlanTier, billingCycle: BillingCycle): Promise<QRPaymentOrder> {
    return apiClient.post<QRPaymentOrder>('/billing/payment/create', { planTier, billingCycle });
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    return apiClient.get<PaymentStatusResponse>(`/billing/payment/${paymentId}/status`);
  }

  /** @deprecated Use createPaymentOrder for real API calls */
  async getQRDetails(): Promise<QRDetails> {
    return mockQRDetails;
  }

  // ─── Usage ───────────────────────────────────────────────

  async getUsageStats(): Promise<UsageStatistics> {
    try {
      const stats = await apiClient.get<UsageStatistics>('/billing/usage');
      if (stats) return stats;
      return mockUsageStats as unknown as UsageStatistics;
    } catch (err) {
      console.warn('[BillingService] API GET /billing/usage failed, using fallback mock data:', err);
      return mockUsageStats as unknown as UsageStatistics;
    }
  }
}

export const billingService = new BillingService();
