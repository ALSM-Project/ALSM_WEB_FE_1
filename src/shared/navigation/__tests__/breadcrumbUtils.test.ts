import { describe, it, expect } from 'vitest';
import { generateBreadcrumbs } from '../breadcrumbUtils';

describe('breadcrumbUtils', () => {
  it('returns home breadcrumb at root', () => {
    expect(generateBreadcrumbs('/')).toEqual([{ label: 'Dashboard' }]);
  });

  it('returns Contract & Billing > Service Usage & Quotas for /billing/usage', () => {
    expect(generateBreadcrumbs('/billing/usage')).toEqual([
      { label: 'Contract & Billing' },
      { label: 'Service Usage & Quotas' },
    ]);
  });

  it('returns Contract & Billing > Invoices & Payments for /billing/invoices', () => {
    expect(generateBreadcrumbs('/billing/invoices')).toEqual([
      { label: 'Contract & Billing' },
      { label: 'Invoices & Payments' },
    ]);
  });

  it('returns Contract & Billing > Enterprise Contracts for /contracts', () => {
    expect(generateBreadcrumbs('/contracts')).toEqual([
      { label: 'Contract & Billing' },
      { label: 'Enterprise Contracts' },
    ]);
  });

  it('returns Organization > Organization Profile for /organization/profile', () => {
    expect(generateBreadcrumbs('/organization/profile')).toEqual([
      { label: 'Organization' },
      { label: 'Organization Profile' },
    ]);
  });
});
