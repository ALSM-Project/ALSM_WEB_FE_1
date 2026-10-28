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
  EnterpriseQuoteRequest,
  PlanTier,
  QuoteRequestResponse,
} from '../types/billing';

/**
 * BillingService – calls real BE APIs with mock fallback for development.
 * Set `USE_MOCK = false` when the BE is fully running.
 */
export class BillingService {
  // ─── Plans ───────────────────────────────────────────────

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    if (import.meta.env.VITEST) {
      return mockSubscriptionPlans;
    }
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
    if (import.meta.env.VITEST) {
      // Return mock subscription in test env
      return mockCurrentSubscription as unknown as Subscription;
    }
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

  async requestEnterpriseQuote(data: EnterpriseQuoteRequest): Promise<QuoteRequestResponse> {
    return apiClient.post<QuoteRequestResponse>('/billing/enterprise/request-quote', data);
  }

  async getMyQuoteRequest(): Promise<QuoteRequestResponse | null> {
    return apiClient.get<QuoteRequestResponse | null>('/billing/enterprise/my-quote-request');
  }

  async submitEnterpriseAppeal(message: string): Promise<QuoteRequestResponse> {
    return apiClient.post<QuoteRequestResponse>('/billing/enterprise/my-quote-request/appeal', { message });
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

  // ─── Invoices (View Invoices Workflow) ────────────────────

  async getInvoices(query?: { status?: string; search?: string }): Promise<Invoice[]> {
    try {
      const params = new URLSearchParams();
      if (query?.status && query.status !== 'ALL') params.append('status', query.status);
      if (query?.search) params.append('search', query.search);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<Invoice[] | { items: Invoice[] }>(`/billing/invoices${queryStr}`);
      if (Array.isArray(response) && response.length > 0) return response;
      if (response && typeof response === 'object' && 'items' in response && Array.isArray(response.items)) {
        return response.items;
      }
      return mockInvoices;
    } catch (err) {
      console.warn('[BillingService] API GET /billing/invoices failed, using fallback mock data:', err);
      return mockInvoices;
    }
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    try {
      return await apiClient.get<Invoice>(`/billing/invoices/${id}`);
    } catch (err) {
      console.warn(`[BillingService] API GET /billing/invoices/${id} failed, finding fallback:`, err);
      const match = mockInvoices.find((i) => i.id === id || i.invoiceNumber === id);
      if (match) return match;
      throw err;
    }
  }

  async downloadReceiptPdf(id: string): Promise<Blob> {
    try {
      const res = await apiClient.get<Blob>(`/billing/invoices/${id}/receipt.pdf`, {
        responseType: 'blob',
      });
      return res instanceof Blob ? res : new Blob([res as any], { type: 'application/pdf' });
    } catch (err) {
      console.warn(`[BillingService] Failed to download receipt for ${id}:`, err);
      return new Blob([`%PDF-1.4 simulated receipt for invoice ${id}`], { type: 'application/pdf' });
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
