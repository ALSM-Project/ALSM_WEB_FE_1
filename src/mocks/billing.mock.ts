import type {
  SubscriptionPlan,
  Subscription,
  UsageStatistics,
  Invoice,
  QRDetails,
} from '@/features/billing/types/billing';

export const mockSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'plan-free',
    name: 'Free',
    tier: 'free',
    price: 0,
    currency: 'USD',
    description: 'Get started with basic modernization tools.',
    features: ['5 screens/month', '1 project', 'Basic export', 'Community support'],
    maxScreens: 5,
    maxProjects: 1,
  },
  {
    id: 'plan-starter',
    name: 'Starter',
    tier: 'starter',
    price: 49,
    annualPrice: 470,
    currency: 'USD',
    description: 'For small teams modernizing legacy systems.',
    features: ['100 screens/month', '5 projects', 'All export formats', 'Email support'],
    maxScreens: 100,
    maxProjects: 5,
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    tier: 'pro',
    price: 149,
    annualPrice: 1430,
    currency: 'USD',
    description: 'For growing teams with complex legacy portfolios.',
    features: ['500 screens/month', '20 projects', 'Priority support', 'Advanced analytics', 'API access'],
    maxScreens: 500,
    maxProjects: 20,
    isPopular: true,
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    price: 499,
    annualPrice: 4790,
    currency: 'USD',
    description: 'For large enterprises with dedicated support.',
    features: ['Unlimited screens', 'Unlimited projects', 'Dedicated support', 'SLA', 'Custom integrations', 'SSO'],
    maxScreens: 999999,
    maxProjects: 999999,
  },
];

export const mockCurrentSubscription: Subscription = {
  id: 'sub-001',
  planId: 'plan-pro',
  planName: 'Pro',
  tier: 'pro',
  status: 'trialing',
  billingCycle: 'monthly',
  currentPeriodStart: '2026-09-01T00:00:00Z',
  currentPeriodEnd: '2026-09-30T00:00:00Z',
  cancelAtPeriodEnd: false,
};

export const mockUsageStats: UsageStatistics = {
  screensUsed: 45,
  screensLimit: 500,
  projectsUsed: 3,
  projectsLimit: 20,
  periodStart: '2026-09-01T00:00:00Z',
  periodEnd: '2026-09-30T00:00:00Z',
};

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    date: '2026-08-01T00:00:00Z',
    amount: 149,
    currency: 'USD',
    status: 'paid',
  },
  {
    id: 'inv-002',
    date: '2026-07-01T00:00:00Z',
    amount: 149,
    currency: 'USD',
    status: 'paid',
  },
];

export const mockQRDetails: QRDetails = {
  qrCode: 'data:image/png;base64,mockQRCodeData',
  amount: 149,
  currency: 'USD',
  expiresAt: '2026-09-15T18:00:00Z',
  orderId: 'order-001',
};
