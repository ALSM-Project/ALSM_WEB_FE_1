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
const USE_MOCK = true;

export class BillingService {
  // ─── Plans ───────────────────────────────────────────────

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    if (USE_MOCK) return mockSubscriptionPlans;
    return apiClient.get<SubscriptionPlan[]>('/billing/plans');
  }

  // ─── Subscription ────────────────────────────────────────

  async getCurrentSubscription(): Promise<Subscription | LegacySubscription | null> {
    if (USE_MOCK) return mockCurrentSubscription;
    return apiClient.get<Subscription | null>('/billing/subscription');
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
    if (USE_MOCK) {
      console.log('[BillingService] Upgrade plan to:', targetPlanTier);
      await new Promise((resolve) => setTimeout(resolve, 600));
      return true;
    }
    await apiClient.put('/billing/subscription/upgrade', { targetPlanTier });
    return true;
  }

  // ─── Cancel ──────────────────────────────────────────────

  async cancelSubscription(reason: string, feedback?: string): Promise<boolean> {
    if (USE_MOCK) {
      console.log('[BillingService] Subscription cancellation requested:', { reason, feedback });
      await new Promise((resolve) => setTimeout(resolve, 500));
      return true;
    }
    await apiClient.post('/billing/subscription/cancel', { reason, feedback });
    return true;
  }

  // ─── Invoices ────────────────────────────────────────────

  async getInvoices(): Promise<Invoice[]> {
    if (USE_MOCK) return mockInvoices as unknown as Invoice[];
    return apiClient.get<Invoice[]>('/billing/invoices');
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
    if (USE_MOCK) return mockUsageStats as unknown as UsageStatistics;
    return apiClient.get<UsageStatistics>('/billing/usage');
  }
}

export const billingService = new BillingService();
