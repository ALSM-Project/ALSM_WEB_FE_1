import type { LegacySubscription, QRDetails, SubscriptionPlan, UsageStatistics } from '@/features/billing/types/billing';

export const mockSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    description: 'Essential tools for small teams modernizing single applications.',
    monthlyPrice: 99_000,
    annualPrice: 79_000,
    features: [
      '1 Project',
      '10 Screens per month',
      '5GB Storage',
      'Basic UI token export',
      'Community support',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    description: 'Advanced AI capabilities for high-velocity engineering workflows.',
    monthlyPrice: 499_000,
    annualPrice: 399_000,
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
    id: 'ENTERPRISE',
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

export const mockCurrentSubscription: LegacySubscription = {
  planId: 'PROFESSIONAL',
  planName: 'Pro Tier',
  status: 'Active',
  nextBillingDate: 'Dec 31, 2026',
  amount: 499_000,
  billingCycle: 'MONTHLY',
  paymentMethodMask: '•••• 4242',
};

export const mockInvoices = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2026-0042',
    planName: 'Professional',
    amountVnd: 499_000,
    status: 'PAID' as const,
    billingPeriodStart: '2026-09-01',
    billingPeriodEnd: '2026-09-30',
    paidAt: '2026-10-01',
    paymentMethod: 'QR Bank Transfer',
    createdAt: '2026-10-01',
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2026-0041',
    planName: 'Professional',
    amountVnd: 499_000,
    status: 'PAID' as const,
    billingPeriodStart: '2026-08-01',
    billingPeriodEnd: '2026-08-31',
    paidAt: '2026-09-01',
    paymentMethod: 'QR Bank Transfer',
    createdAt: '2026-09-01',
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2026-0040',
    planName: 'Professional',
    amountVnd: 499_000,
    status: 'PAID' as const,
    billingPeriodStart: '2026-07-01',
    billingPeriodEnd: '2026-07-31',
    paidAt: '2026-08-01',
    paymentMethod: 'QR Bank Transfer',
    createdAt: '2026-08-01',
  },
];

export const mockQRDetails: QRDetails = {
  invoiceId: 'INV-2026-0142',
  planName: 'Professional (Monthly)',
  amount: 499_000,
  currency: '₫',
  bankName: 'MB Bank',
  accountNumber: '005220248888',
  accountName: 'MODERNIZER JSC',
  referenceCode: 'ALSM000142',
};

export const mockUsageStats: UsageStatistics = {
  plan: {
    tier: 'PROFESSIONAL',
    name: 'Professional',
  },
  screens: {
    used: 45,
    max: 100,
  },
  projects: {
    used: 4,
    max: -1,
  },
  storage: {
    usedGb: 12.4,
    maxGb: 50,
  },
  monthlyConversions: [
    { month: 'Jun', count: 12 },
    { month: 'Jul', count: 24 },
    { month: 'Aug', count: 32 },
    { month: 'Sep', count: 38 },
    { month: 'Oct', count: 42 },
    { month: 'Nov', count: 45 },
  ],
};
