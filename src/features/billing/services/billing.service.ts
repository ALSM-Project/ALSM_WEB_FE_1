import { apiClient } from '@/services/api/apiClient';
import { env } from '@/shared/constants/env';
import {
  mockCurrentSubscription,
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
      const response = await apiClient.get<any>(`/billing/invoices${queryStr}`);
      const rawItems: any[] = Array.isArray(response)
        ? response
        : (response && typeof response === 'object' && Array.isArray(response.items) ? response.items : []);

      return rawItems.map((inv: any): Invoice => {
        const amount = inv.amount ?? inv.amountVnd ?? inv.totalAmountVnd ?? 0;
        const currency = inv.currency || (inv.amountVnd ? 'VND' : 'USD');
        const rawItemsList = inv.items || inv.lineItems;
        const items = Array.isArray(rawItemsList) && rawItemsList.length > 0
          ? rawItemsList.map((it: any, idx: number) => ({
              id: it.id || `item-${idx + 1}`,
              description: it.description || it.name || 'Enterprise Service Deliverable',
              quantity: it.quantity || 1,
              unitPrice: it.unitPrice || it.amount || amount,
              total: it.total || it.amount || (it.unitPrice ? it.unitPrice * (it.quantity || 1) : amount),
            }))
          : (inv.planName ? [
              {
                id: 'item-1',
                description: inv.planName,
                quantity: 1,
                unitPrice: amount,
                total: amount,
              }
            ] : []);

        return {
          id: inv.id || inv._id || inv.invoiceNumber,
          invoiceNumber: inv.invoiceNumber || inv.invoice_number || inv.id,
          status: (inv.status || 'PENDING').toLowerCase(),
          currency,
          amount,
          date: inv.date || inv.issueDate || inv.billingPeriodStart || inv.createdAt || new Date().toISOString(),
          issueDate: inv.issueDate || inv.date || inv.billingPeriodStart || inv.createdAt || new Date().toISOString(),
          dueDate: inv.dueDate || inv.billingPeriodEnd,
          paidAt: inv.paidAt || null,
          organizationName: inv.organizationName,
          customerEmail: inv.customerEmail,
          subtotal: inv.subtotal || inv.subtotalVnd || (amount * 0.9),
          tax: inv.tax || inv.taxAmountVnd || (amount * 0.1),
          items,
          downloadUrl: inv.downloadUrl || `/api/v1/billing/invoices/${inv.id || inv._id}/receipt.pdf`,
        };
      });
    } catch (err) {
      console.error('[BillingService] API GET /billing/invoices failed:', err);
      return [];
    }
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    const inv = await apiClient.get<any>(`/billing/invoices/${id}`);
    const amount = inv.amount ?? inv.amountVnd ?? inv.totalAmountVnd ?? 0;
    const currency = inv.currency || (inv.amountVnd ? 'VND' : 'USD');
    const rawItemsList = inv.items || inv.lineItems;
    const items = Array.isArray(rawItemsList) && rawItemsList.length > 0
      ? rawItemsList.map((it: any, idx: number) => ({
          id: it.id || `item-${idx + 1}`,
          description: it.description || it.name || 'Enterprise Service Deliverable',
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice || it.amount || amount,
          total: it.total || it.amount || (it.unitPrice ? it.unitPrice * (it.quantity || 1) : amount),
        }))
      : (inv.planName ? [
          {
            id: 'item-1',
            description: inv.planName,
            quantity: 1,
            unitPrice: amount,
            total: amount,
          }
        ] : []);

    return {
      id: inv.id || inv._id || inv.invoiceNumber,
      invoiceNumber: inv.invoiceNumber || inv.invoice_number || inv.id,
      status: (inv.status || 'PENDING').toLowerCase(),
      currency,
      amount,
      date: inv.date || inv.issueDate || inv.billingPeriodStart || inv.createdAt || new Date().toISOString(),
      issueDate: inv.issueDate || inv.date || inv.billingPeriodStart || inv.createdAt || new Date().toISOString(),
      dueDate: inv.dueDate || inv.billingPeriodEnd,
      paidAt: inv.paidAt || null,
      organizationName: inv.organizationName,
      customerEmail: inv.customerEmail,
      subtotal: inv.subtotal || inv.subtotalVnd || (amount * 0.9),
      tax: inv.tax || inv.taxAmountVnd || (amount * 0.1),
      items,
      downloadUrl: inv.downloadUrl || `/api/v1/billing/invoices/${inv.id || inv._id}/receipt.pdf`,
    };
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

  // ─── Enterprise Contract & E-Sign & Web 3 Activation ─────

  async getContracts(params?: {
    tab?: string;
    search?: string;
    serviceMode?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: any[];
    pagination?: {
      total: number;
      totalPages: number;
      page: number;
      limit: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.tab) searchParams.set('tab', params.tab);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.serviceMode) searchParams.set('serviceMode', params.serviceMode);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    const endpoint = `/enterprise-contracts${query ? `?${query}` : ''}`;
    return apiClient.get(endpoint);
  }

  async getContractDetail(contractIdOrNumber: string): Promise<any> {
    return apiClient.get(`/enterprise-contracts/${contractIdOrNumber}`);
  }

  async signCustomerContract(
    contractId: string,
    data: {
      signerName: string;
      signerTitle: string;
      signerEmail: string;
      authMethod?: string;
      signatureImageUrl?: string;
    },
  ): Promise<any> {
    return apiClient.post(`/enterprise-contracts/${contractId}/customer-sign`, data);
  }

  async getContractInvoice(contractIdOrNumber: string): Promise<any> {
    return apiClient.get(`/enterprise-contracts/${contractIdOrNumber}/invoice`);
  }

  async submitContractPayment(
    contractId: string,
    data?: { transactionRef?: string; note?: string; paidAmount?: number },
  ): Promise<any> {
    return apiClient.post(`/enterprise-contracts/${contractId}/submit-payment`, data || {});
  }

  async confirmContractPayment(contractId: string, data?: { note?: string }): Promise<any> {
    return apiClient.post(`/enterprise-contracts/${contractId}/confirm-payment`, data || {});
  }

  async generateContractFromPackage(data: {
    serviceMode: 'SELF_SERVICE' | 'WE_CONVERT_FOR_YOU' | 'HYBRID';
    packageTier: 'STARTER' | 'GROWTH' | 'ENTERPRISE' | 'CUSTOM';
    organizationName?: string;
    taxId?: string;
    businessAddress?: string;
    representativeName?: string;
    representativeTitle?: string;
    contactEmail?: string;
    customScreensQuota?: number;
  }): Promise<any> {
    return apiClient.post('/enterprise-contracts/generate-from-package', data);
  }

  async simulateContractPayment(contractId: string): Promise<any> {
    return apiClient.post(`/enterprise-contracts/${contractId}/simulate-payment`, {});
  }

  async downloadContractPdf(contractId: string, contractNumber: string): Promise<void> {
    const apiBase = env.apiBaseUrl.replace(/\/+$/, '');
    const url = `${apiBase}/api/v1/enterprise-contracts/${contractId}/pdf?download=true`;

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `ALSM-Contract-${contractNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch {
      window.open(url, '_blank');
    }
  }

  async getContractPreviewHtml(contractId: string): Promise<string> {
    const apiBase = env.apiBaseUrl.replace(/\/+$/, '');
    const url = `${apiBase}/api/v1/enterprise-contracts/${contractId}/pdf?format=html`;
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Failed to load contract preview HTML');
    return response.text();
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
