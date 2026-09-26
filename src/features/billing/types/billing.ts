// Billing Types

export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: PlanTier;
  price: number;
  annualPrice?: number;
  currency: string;
  description: string;
  features: string[];
  maxScreens: number;
  maxProjects: number;
  isPopular?: boolean;
}

export interface Subscription {
  id: string;
  planId: string;
  planName: string;
  tier: PlanTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface LegacySubscription {
  plan: string;
  status: string;
  expiresAt?: string;
}

export interface UsageStatistics {
  screensUsed: number;
  screensLimit: number;
  projectsUsed: number;
  projectsLimit: number;
  periodStart: string;
  periodEnd: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  downloadUrl?: string;
}

export interface QRDetails {
  qrCode: string;
  amount: number;
  currency: string;
  expiresAt: string;
  orderId: string;
}

export interface QRPaymentOrder {
  orderId: string;
  planId: string;
  billingCycle: BillingCycle;
}

export interface PaymentStatusResponse {
  orderId: string;
  status: 'pending' | 'success' | 'failed';
  message?: string;
}

export interface UpgradePreview {
  currentPlan: string;
  newPlan: string;
  proratedAmount: number;
  currency: string;
  nextBillingDate: string;
}

export interface EnterpriseQuoteRequest {
  fullName: string;
  companyName: string;
  email: string;
  phone?: string;
  message?: string;
}

export interface QuoteRequestResponse {
  id: string;
  status: 'PENDING' | 'CONTACTED' | 'CLOSED';
  fullName: string;
  companyName: string;
  email: string;
  phone?: string;
  message?: string;
  currentPlanTier: PlanTier | string;
  createdAt: string;
}

export type QuoteRequestStatus = QuoteRequestResponse['status'];
