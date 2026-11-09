import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CompanyLegalProfilePage } from './CompanyLegalProfilePage';
import { companyLegalProfileService } from '../services/companyLegalProfile.service';

vi.mock('@/app/providers', () => ({
  useAuth: () => ({
    user: {
      id: 'usr_123',
      fullName: 'Le Van Minh',
      email: 'minh.le@enterprise.com',
      organizationId: 'org_889900',
      organizationName: 'Enterprise Core JSC',
    },
  }),
}));

vi.mock('../services/companyLegalProfile.service', () => ({
  companyLegalProfileService: {
    getTaxLookupStatus: vi.fn(),
    lookupTaxId: vi.fn(),
    getLegalProfile: vi.fn(),
    updateLegalProfile: vi.fn(),
  },
}));

describe('CompanyLegalProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (companyLegalProfileService.getTaxLookupStatus as any).mockResolvedValue({
      isConfigured: false,
      providerName: 'National Business Registry Adapter',
      supportedFormats: ['10-digit Enterprise Tax ID'],
      message: 'Tax lookup provider API endpoint is not configured in environment variables. Manual entry is supported.',
    });
    (companyLegalProfileService.getLegalProfile as any).mockResolvedValue({
      organizationId: 'org_889900',
      organizationName: 'Enterprise Core JSC',
      legalProfile: {
        taxId: '0109876543',
        legalCompanyName: 'ENTERPRISE CORE CORPORATION',
        registeredAddress: 'Landmark 72 Tower, Pham Hung, Hanoi',
        legalRepresentative: 'Le Van Minh',
        representativeTitle: 'General Director',
        contactEmail: 'minh.le@enterprise.com',
        verificationStatus: 'TAX_VERIFIED',
      },
    });
  });

  it('renders the Tax ID lookup form, input, and statutory disclaimer', async () => {
    render(
      <MemoryRouter>
        <CompanyLegalProfilePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Company Legal Profile & Registry Verification/i)).toBeInTheDocument();
    expect(screen.getByText(/Lookup Registry/i)).toBeInTheDocument();
    expect(screen.getByText(/Legal Authority Notice & Disclaimer/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Registry vs\. Identity Verification:/i)
    ).toBeInTheDocument();
  });

  it('validates Tax ID format and displays validation warning on invalid length', async () => {
    render(
      <MemoryRouter>
        <CompanyLegalProfilePage />
      </MemoryRouter>
    );

    const taxInput = screen.getByPlaceholderText(/Enterprise 10-digit Tax ID/i);
    fireEvent.change(taxInput, { target: { value: '123' } });

    await waitFor(() => {
      expect(screen.getByText(/Tax ID must consist of 10 digits/i)).toBeInTheDocument();
    });
  });

  it('handles lookup failure gracefully and informs customer to use manual entry', async () => {
    (companyLegalProfileService.lookupTaxId as any).mockRejectedValueOnce({
      response: {
        data: {
          message: 'No active business registration found for Tax ID: 0109876543.',
        },
      },
    });

    render(
      <MemoryRouter>
        <CompanyLegalProfilePage />
      </MemoryRouter>
    );

    const taxInput = screen.getByPlaceholderText(/Enterprise 10-digit Tax ID/i);
    fireEvent.change(taxInput, { target: { value: '0109876543' } });

    const lookupBtn = screen.getByRole('button', { name: /Lookup Registry/i });
    fireEvent.click(lookupBtn);

    await waitFor(() => {
      expect(screen.getByText(/Lookup Unsuccessful \/ No Record Found/i)).toBeInTheDocument();
      expect(screen.getByText(/No active business registration found/i)).toBeInTheDocument();
    });
  });
});
