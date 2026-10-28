import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvoicesPage } from './InvoicesPage';
import { billingService } from '../services/billing.service';
import type { Invoice } from '../types/billing';

vi.mock('../services/billing.service', () => ({
  billingService: {
    getInvoices: vi.fn(),
    getInvoiceById: vi.fn(),
    downloadReceiptPdf: vi.fn(),
  },
}));

const mockInvoicesList: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2026-001',
    date: '2026-08-01T00:00:00Z',
    issueDate: '2026-08-01T00:00:00Z',
    dueDate: '2026-08-15T00:00:00Z',
    paidAt: '2026-08-02T10:00:00Z',
    amount: 149,
    currency: 'USD',
    status: 'paid',
    organizationName: 'Acme Enterprise Corp',
    customerEmail: 'alice@acme.com',
    subtotal: 135,
    tax: 14,
    items: [
      { id: 'item-1', description: 'Professional Monthly Plan Subscription', quantity: 1, unitPrice: 149, total: 149 },
    ],
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2026-002',
    date: '2026-09-01T00:00:00Z',
    issueDate: '2026-09-01T00:00:00Z',
    dueDate: '2026-09-15T00:00:00Z',
    amount: 499,
    currency: 'USD',
    status: 'pending',
    organizationName: 'Beta Logistics',
    customerEmail: 'bob@beta.com',
    subtotal: 450,
    tax: 49,
    items: [
      { id: 'item-2', description: 'Enterprise Custom Provisioning Add-on', quantity: 1, unitPrice: 499, total: 499 },
    ],
  },
];

describe('InvoicesPage (Web 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(billingService.getInvoices).mockResolvedValue(mockInvoicesList);
    vi.mocked(billingService.downloadReceiptPdf).mockResolvedValue(
      new Blob(['test-pdf'], { type: 'application/pdf' })
    );

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  it('renders page header and summary metrics correctly', async () => {
    render(<InvoicesPage />);

    expect(screen.getByText(/Invoices & Billing History/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('INV-2026-001')).toBeInTheDocument();
      expect(screen.getByText('INV-2026-002')).toBeInTheDocument();
    });

    // Total invoiced: 149 + 499 = $648
    expect(screen.getByText('$648')).toBeInTheDocument();
    // Settled: $149 appears in metric and table row
    expect(screen.getAllByText('$149').length).toBeGreaterThanOrEqual(1);
    // Outstanding: $499 appears in metric and table row
    expect(screen.getAllByText('$499').length).toBeGreaterThanOrEqual(1);
  });

  it('filters invoices by search term', async () => {
    render(<InvoicesPage />);

    await waitFor(() => {
      expect(screen.getByText('INV-2026-001')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by invoice #/i);
    fireEvent.change(searchInput, { target: { value: 'Beta' } });

    expect(screen.queryByText('INV-2026-001')).not.toBeInTheDocument();
    expect(screen.getByText('INV-2026-002')).toBeInTheDocument();
  });

  it('filters invoices by status tab', async () => {
    render(<InvoicesPage />);

    await waitFor(() => {
      expect(screen.getByText('INV-2026-001')).toBeInTheDocument();
    });

    const pendingTab = screen.getByRole('button', { name: /^Pending$/i });
    fireEvent.click(pendingTab);

    await waitFor(() => {
      expect(screen.queryByText('INV-2026-001')).not.toBeInTheDocument();
      expect(screen.getByText('INV-2026-002')).toBeInTheDocument();
    });
  });

  it('opens invoice detail modal on row click', async () => {
    render(<InvoicesPage />);

    await waitFor(() => {
      expect(screen.getByText('INV-2026-001')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('INV-2026-001'));

    await waitFor(() => {
      expect(screen.getByText(/Itemized Billing Breakdown/i)).toBeInTheDocument();
      expect(screen.getAllByText('Professional Monthly Plan Subscription').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('alice@acme.com')).toBeInTheDocument();
    });
  });

  it('triggers receipt PDF download on click', async () => {
    render(<InvoicesPage />);

    await waitFor(() => {
      expect(screen.getByText('INV-2026-001')).toBeInTheDocument();
    });

    const downloadButtons = screen.getAllByTitle(/Download Official Receipt PDF/i);
    fireEvent.click(downloadButtons[0]);

    await waitFor(() => {
      expect(billingService.downloadReceiptPdf).toHaveBeenCalledWith('inv-001');
      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });
  });
});
