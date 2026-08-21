import type { Invoice, QRDetails, Subscription, SubscriptionPlan, UsageStatistics } from '@/features/billing/types/billing';

export const mockSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'Starter',
    name: 'Starter',
    description: 'Essential tools for small teams modernizing single applications.',
    monthlyPrice: 99,
    annualPrice: 79,
    features: [
      '1 Project',
      '10 Screens per month',
      '5GB Storage',
      'Basic UI token export',
      'Community support',
    ],
  },
  {
    id: 'Professional',
    name: 'Professional',
    description: 'Advanced AI capabilities for high-velocity engineering workflows.',
    monthlyPrice: 499,
    annualPrice: 399,
    isPopular: true,
    features: [
      'Unlimited Projects',
      '100 Screens per month',
      '50GB Storage',
      'AI-assisted structural mapping',
      'Code review workflow',
      'Priority email support',
    ],
  },
  {
    id: 'Enterprise',
    name: 'Enterprise',
    description: 'Custom deployment and maximum security for large organizations.',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Unlimited screens & storage',
      'Dedicated CSM',
      'SSO/SAML Integration',
      'On-premise deployment option',
      'Custom AI model training',
      '99.9% Uptime SLA',
    ],
  },
];

export const mockCurrentSubscription: Subscription = {
  planId: 'Professional',
  planName: 'Pro Tier',
  status: 'Active',
  nextBillingDate: 'Dec 31, 2026',
  amount: 499,
  billingCycle: 'Monthly',
  paymentMethodMask: '•••• 4242',
};

export const mockInvoices: Invoice[] = [
  {
    id: 'INV-2026-0042',
    invoiceDate: 'Oct 1, 2026',
    billingPeriod: 'Sep 1 - Sep 30, 2026',
    amountPaid: '$1,250.00',
    paymentMethod: 'Visa •••• 4242',
    status: 'Paid',
  },
  {
    id: 'INV-2026-0041',
    invoiceDate: 'Sep 1, 2026',
    billingPeriod: 'Aug 1 - Aug 31, 2026',
    amountPaid: '$499.00',
    paymentMethod: 'Visa •••• 4242',
    status: 'Paid',
  },
  {
    id: 'INV-2026-0040',
    invoiceDate: 'Aug 1, 2026',
    billingPeriod: 'Jul 1 - Jul 31, 2026',
    amountPaid: '$499.00',
    paymentMethod: 'Visa •••• 4242',
    status: 'Paid',
  },
  {
    id: 'INV-2026-0039',
    invoiceDate: 'Jul 1, 2026',
    billingPeriod: 'Jun 1 - Jun 30, 2026',
    amountPaid: '$499.00',
    paymentMethod: 'Visa •••• 4242',
    status: 'Paid',
  },
];

export const mockQRDetails: QRDetails = {
  invoiceId: 'INV-2026-0142',
  planName: 'Professional (Monthly)',
  amount: 499000,
  currency: '₫',
  bankName: 'MB Bank',
  accountNumber: '005220248888',
  accountName: 'MODERNIZER JSC',
  referenceCode: 'MODERNIZER 0142',
};

export const mockUsageStats: UsageStatistics = {
  screensUsed: 45,
  screensMax: 100,
  containersUsed: 4,
  containersMax: 10,
  storageUsedGb: 12.4,
  storageMaxGb: 50,
  monthlyConversions: [
    { month: 'Jun', count: 12 },
    { month: 'Jul', count: 24 },
    { month: 'Aug', count: 32 },
    { month: 'Sep', count: 38 },
    { month: 'Oct', count: 42 },
    { month: 'Nov', count: 45 },
  ],
};
