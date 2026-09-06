export type PlanTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';
export type SubscriptionStatusType = 'ACTIVE' | 'TRIAL' | 'CANCELLED' | 'EXPIRED' | 'PENDING_PAYMENT';
export type InvoiceStatusType = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
export type PaymentStatusType = 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED';

export interface SubscriptionPlan {
  id: PlanTier;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  isPopular?: boolean;
  features: string[];
  trialText?: string;
  ctaText?: string;
  ctaVariant?: 'primary' | 'outline' | 'secondary';
  specs?: { label: string; highlight?: boolean }[];
}


export interface Subscription {
  id: string;
  planTier: PlanTier;
  planName: string;
  status: SubscriptionStatusType;
  billingCycle: BillingCycle;
  amountVnd: number;
  trialEndsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  planName: string;
  amountVnd: number;
  status: InvoiceStatusType;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  paidAt?: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface QRPaymentOrder {
  paymentId: string;
  subscriptionId: string;
  invoiceNumber: string;
  planName: string;
  amountVnd: number;
  currency: string;
  referenceCode: string;
  qrDataUrl: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  expiresAt: string;
}

export interface PaymentStatusResponse {
  status: PaymentStatusType;
  paidAt?: string;
  amountVnd?: number;
}

export interface UpgradePreview {
  currentPlan: {
    tier: PlanTier;
    name: string;
    amountVnd: number;
  };
  targetPlan: {
    tier: PlanTier;
    name: string;
    monthlyPriceVnd: number;
    features: string[];
  };
  proration: {
    creditRemainingVnd: number;
    proratedNewCostVnd: number;
    dueTodayVnd: number;
    remainingDays: number;
  };
}

export interface UsageStatistics {
  plan: {
    tier: PlanTier;
    name: string;
  };
  screens: {
    used: number;
    max: number;
  };
  projects: {
    used: number;
    max: number;
  };
  storage: {
    usedGb: number;
    maxGb: number;
  };
  monthlyConversions: { month: string; count: number }[];
}

// ─── Legacy compat types (for existing mock-dependent pages) ──
/** @deprecated Use Subscription instead */
export interface LegacySubscription {
  planId: PlanTier;
  planName: string;
  status: 'Active' | 'Trial' | 'Cancelled' | 'Expired';
  nextBillingDate: string;
  amount: number;
  billingCycle: BillingCycle;
  paymentMethodMask: string;
}

/** @deprecated Use QRPaymentOrder instead */
export interface QRDetails {
  invoiceId: string;
  planName: string;
  amount: number;
  currency: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  referenceCode: string;
}
