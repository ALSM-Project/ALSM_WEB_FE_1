import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RequestEnterprisePage } from './RequestEnterprisePage';
import { billingService } from '@/features/billing/services/billing.service';

vi.mock('@/features/billing/services/billing.service', () => ({
  billingService: {
    getMyQuoteRequest: vi.fn(),
    requestEnterpriseQuote: vi.fn(),
  },
}));

vi.mock('@/app/providers', () => ({
  useAuth: () => ({
    user: {
      userId: 'user-123',
      fullName: 'Alice Test',
      companyName: 'Test Corp',
      email: 'alice@test.com',
    },
  }),
}));

describe('RequestEnterprisePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <RequestEnterprisePage />
      </MemoryRouter>
    );
  };

  it('renders existing PENDING request state when user has a pending request', async () => {
    vi.mocked(billingService.getMyQuoteRequest).mockResolvedValue({
      id: 'quote-100',
      userId: 'user-123',
      companyName: 'Test Corp',
      fullName: 'Alice Test',
      email: 'alice@test.com',
      currentPlanTier: 'PROFESSIONAL',
      status: 'PENDING',
      createdAt: '2026-09-25T10:00:00.000Z',
    });

    renderComponent();

    expect(await screen.findByText('Your request is being processed')).toBeInTheDocument();
    expect(screen.getByText('quote-100')).toBeInTheDocument();
    expect(screen.getByText('PENDING REVIEW')).toBeInTheDocument();
  });

  it('renders existing CONTACTED request state when sales team has contacted user', async () => {
    vi.mocked(billingService.getMyQuoteRequest).mockResolvedValue({
      id: 'quote-101',
      userId: 'user-123',
      companyName: 'Test Corp',
      fullName: 'Alice Test',
      email: 'alice@test.com',
      currentPlanTier: 'PROFESSIONAL',
      status: 'CONTACTED',
      createdAt: '2026-09-25T10:00:00.000Z',
    });

    renderComponent();

    expect(await screen.findByText("We've reached out to you")).toBeInTheDocument();
    expect(screen.getByText('Sales Team Contacted You')).toBeInTheDocument();
  });

  it('renders the quote request form when no existing request is found', async () => {
    vi.mocked(billingService.getMyQuoteRequest).mockResolvedValue(null);

    renderComponent();

    expect(await screen.findByRole('heading', { name: /Upgrade to Enterprise Full Migration/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Name/i)).toHaveValue('Alice Test');
    expect(screen.getByLabelText(/Company \/ Organization/i)).toHaveValue('Test Corp');
    expect(screen.getByLabelText(/Work Email/i)).toHaveValue('alice@test.com');
  });

  it('submits quote request successfully and displays quote confirmation', async () => {
    vi.mocked(billingService.getMyQuoteRequest).mockResolvedValue(null);
    vi.mocked(billingService.requestEnterpriseQuote).mockResolvedValue({
      id: 'quote-102',
      userId: 'user-123',
      companyName: 'Test Corp',
      fullName: 'Alice Test',
      email: 'alice@test.com',
      currentPlanTier: 'PROFESSIONAL',
      status: 'PENDING',
      createdAt: '2026-09-26T10:00:00.000Z',
    });

    renderComponent();

    await screen.findByRole('heading', { name: /Upgrade to Enterprise Full Migration/i });

    const submitBtn = screen.getByRole('button', { name: /Submit Enterprise Quote Request/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Thank you, Alice Test!')).toBeInTheDocument();
      expect(screen.getByText('quote-102')).toBeInTheDocument();
    });

    expect(billingService.requestEnterpriseQuote).toHaveBeenCalledWith({
      fullName: 'Alice Test',
      companyName: 'Test Corp',
      email: 'alice@test.com',
      phone: undefined,
      message: undefined,
    });
  });

  it('displays conflict error message when QUOTE_REQUEST_EXISTS error occurs', async () => {
    vi.mocked(billingService.getMyQuoteRequest).mockResolvedValue(null);
    vi.mocked(billingService.requestEnterpriseQuote).mockRejectedValue({
      response: {
        data: {
          code: 'QUOTE_REQUEST_EXISTS',
          message: 'Pending request exists',
        },
      },
    });

    renderComponent();

    await screen.findByRole('heading', { name: /Upgrade to Enterprise Full Migration/i });

    const submitBtn = screen.getByRole('button', { name: /Submit Enterprise Quote Request/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('You already have a pending Enterprise quote request. Our sales team is processing it.')
      ).toBeInTheDocument();
    });
  });
});
