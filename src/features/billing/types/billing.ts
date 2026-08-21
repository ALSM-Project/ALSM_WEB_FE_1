export type PlanTier = 'Starter' | 'Professional' | 'Enterprise';
export type BillingCycle = 'Monthly' | 'Annual';

export interface SubscriptionPlan {
  id: PlanTier;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  isPopular?: boolean;
  features: string[];
}

export interface Subscription {
  planId: PlanTier;
  planName: string;
  status: 'Active' | 'Trial' | 'Cancelled' | 'Expired';
  nextBillingDate: string;
  amount: number;
  billingCycle: BillingCycle;
  paymentMethodMask: string;
}

export interface Invoice {
  id: string;
  invoiceDate: string;
  billingPeriod: string;
  amountPaid: string;
  paymentMethod: string;
  status: 'Paid' | 'Pending' | 'Failed';
}

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

export interface UsageStatistics {
  screensUsed: number;
  screensMax: number;
  containersUsed: number;
  containersMax: number;
  storageUsedGb: number;
  storageMaxGb: number;
  monthlyConversions: { month: string; count: number }[];
}
