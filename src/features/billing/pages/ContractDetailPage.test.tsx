import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContractDetailPage } from './ContractDetailPage';
import { billingService } from '../services/billing.service';

vi.mock('../services/billing.service', () => ({
  billingService: {
    getContractDetail: vi.fn(),
    signCustomerContract: vi.fn(),
    submitContractPayment: vi.fn(),
    confirmContractPayment: vi.fn(),
    simulateContractPayment: vi.fn(),
    downloadContractPdf: vi.fn(),
  },
}));

const mockUnsignedContract = {
  id: 'ctr-001',
  contractNumber: 'ALSM-CTR-2026-C477',
  title: 'Enterprise Modernization Agreement - Client Workspace',
  serviceMode: 'WE_CONVERT_FOR_YOU',
  contractStatus: 'Pending Signature',
  paymentStatus: 'Not Required',
  isDemoMode: true,
  effectiveDate: '2026-11-01',
  endDate: '2027-10-31',
  totalValue: 550000000,
  screensQuota: 100,
  customer: {
    companyName: 'Client Workspace LLC',
    taxId: '0108849201',
    businessAddress: 'Hanoi, Vietnam',
    representativeName: 'Truong Minh Khoi',
    representativeTitle: 'General Director',
    contactEmail: 'khoi.truong@client.com',
  },
  parties: {
    provider: {
      legalName: 'ALSM SOFTWARE MODERNIZATION TECHNOLOGY JOINT STOCK COMPANY',
      taxId: '0110892345',
      headquarters: 'Hoa Xuan, Cam Le, Da Nang',
      signatoryName: 'Nguyen Gia Khanh',
      signatoryTitle: 'General Director',
      contactEmail: 'contracts@alsm.io',
      bankAccountInfo: 'MB Bank — 0899886249 (ALSM TECHNOLOGY SOLUTIONS)',
    },
    customer: {
      companyName: 'Client Workspace LLC',
      taxId: '0108849201',
      businessAddress: 'Hanoi, Vietnam',
      representativeName: 'Truong Minh Khoi',
      representativeTitle: 'General Director',
      contactEmail: 'khoi.truong@client.com',
    },
  },
  scope: {
    screensQuota: 100,
    programsQuota: 50,
    storageGb: 20,
    sourceCodeType: 'IBM 3270 BMS / AS400 DSPF & COBOL Logic',
    targetTechnology: 'React 19 + TypeScript + Spring Boot 3 Java',
    slaCommitment: '99.9% Platform Availability with Deterministic AST Validation',
  },
  commercialTerms: {
    subtotal: 500000000,
    discountAmount: 0,
    vatRate: 10,
    vatAmount: 50000000,
    totalValue: 550000000,
    currency: 'VND',
  },
  signingStatus: {
    alsm: true,
    customer: false,
  },
  signingProcess: {
    providerSigningStatus: 'SIGNED',
    customerSigningStatus: 'NOT_SIGNED',
    alsmSigner: {
      name: 'Nguyen Gia Khanh',
      title: 'General Director',
      signedAt: '2026-11-01T08:00:00Z',
      certificateReference: 'ALSM-ECA-OFFICIAL',
    },
    customerSigner: null,
  },
};

const mockSignedContract = {
  ...mockUnsignedContract,
  contractStatus: 'Pending Payment',
  paymentStatus: 'Pending Payment',
  signingStatus: {
    alsm: true,
    customer: true,
  },
  signingProcess: {
    ...mockUnsignedContract.signingProcess,
    customerSigningStatus: 'SIGNED',
    customerSigner: {
      name: 'Truong Minh Khoi',
      title: 'General Director',
      email: 'khoi.truong@client.com',
      signedAt: '2026-11-02T10:00:00Z',
      certificateReference: 'VNPT-ECA-VERIFIED',
    },
  },
  invoice: {
    invoiceNumber: 'INV-2026-C477',
    status: 'ISSUED',
    amountVnd: 550000000,
    dueDate: '2026-11-05T10:00:00Z',
    createdAt: '2026-11-02T10:00:00Z',
  },
  qrPayment: {
    qrDataUrl: 'data:image/png;base64,fake-qr-code',
    bankName: 'MB Bank',
    accountNumber: '0899886249',
    accountName: 'ALSM TECHNOLOGY SOLUTIONS',
    referenceCode: 'INV-2026-C477',
  },
};

describe('ContractDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders contract number, title, status badges, and action buttons', async () => {
    (billingService.getContractDetail as any).mockResolvedValue(mockUnsignedContract);

    render(
      <MemoryRouter initialEntries={['/contracts/ctr-001']}>
        <Routes>
          <Route path="/contracts/:contractId" element={<ContractDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('ALSM-CTR-2026-C477')[0]).toBeInTheDocument();
    });

    expect(screen.getByText('Enterprise Modernization Agreement - Client Workspace')).toBeInTheDocument();

    // Action buttons
    expect(screen.getAllByRole('button', { name: /^Preview Contract$/i })[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Refresh$/i })).toBeInTheDocument();
  });

  it('locks payment section when contract is awaiting signature', async () => {
    (billingService.getContractDetail as any).mockResolvedValue(mockUnsignedContract);

    render(
      <MemoryRouter initialEntries={['/contracts/ctr-001']}>
        <Routes>
          <Route path="/contracts/:contractId" element={<ContractDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Provisioning Locked/i)).toBeInTheDocument();
      expect(screen.getByText(/Awaiting Signature/i)).toBeInTheDocument();
    });
  });

  it('opens full Contract Preview modal when clicking Preview Contract button', async () => {
    (billingService.getContractDetail as any).mockResolvedValue(mockUnsignedContract);

    render(
      <MemoryRouter initialEntries={['/contracts/ctr-001']}>
        <Routes>
          <Route path="/contracts/:contractId" element={<ContractDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /^Preview Contract$/i })[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /^Preview Contract$/i })[0]);

    await waitFor(() => {
      expect(screen.getAllByText(/SOCIALIST REPUBLIC OF VIETNAM/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/PARTY A: SERVICE PROVIDER/i)).toBeInTheDocument();
      expect(screen.getByText(/PARTY B: CUSTOMER/i)).toBeInTheDocument();
      expect(screen.getByText(/ARTICLE 1\. SCOPE OF SERVICES/i)).toBeInTheDocument();
      expect(screen.getByText(/ARTICLE 2\. TECHNICAL STANDARDS/i)).toBeInTheDocument();
      expect(screen.getByText(/ARTICLE 3\. CONTRACT VALUE/i)).toBeInTheDocument();
      expect(screen.getAllByText(/REPRESENTATIVE OF PARTY A/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/REPRESENTATIVE OF PARTY B/i)[0]).toBeInTheDocument();
    });
  });

  it('displays invoice and bank transfer details when contract is signed', async () => {
    (billingService.getContractDetail as any).mockResolvedValue(mockSignedContract);

    render(
      <MemoryRouter initialEntries={['/contracts/ctr-001']}>
        <Routes>
          <Route path="/contracts/:contractId" element={<ContractDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Invoice Details')).toBeInTheDocument();
      expect(screen.getAllByText('INV-2026-C477').length).toBeGreaterThan(0);
      expect(screen.getByText('0899886249')).toBeInTheDocument();
      expect(screen.getByText('Direct Bank Transfer (QR Code)')).toBeInTheDocument();
    });
  });

  it('calls downloadContractPdf with proper filename when Download PDF is clicked', async () => {
    (billingService.getContractDetail as any).mockResolvedValue(mockSignedContract);

    render(
      <MemoryRouter initialEntries={['/contracts/ctr-001']}>
        <Routes>
          <Route path="/contracts/:contractId" element={<ContractDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Download Signed PDF')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Download Signed PDF'));

    expect(billingService.downloadContractPdf).toHaveBeenCalledWith(
      'ctr-001',
      'ALSM-CTR-2026-C477'
    );
  });
});
