import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceContactPage } from '../WorkspaceContactPage';

const mocks = vi.hoisted(() => ({
  getUsageStats: vi.fn(),
  submitEnterpriseAppeal: vi.fn(),
}));

vi.mock('@/features/billing/services/billing.service', () => ({
  billingService: {
    getUsageStats: mocks.getUsageStats,
    submitEnterpriseAppeal: mocks.submitEnterpriseAppeal,
  },
}));

const mockUsage = {
  plan: {
    tier: 'ENTERPRISE',
    name: 'Enterprise Scale',
  },
  screens: {
    used: 120,
    max: 500,
  },
  projects: {
    used: 4,
    max: 10,
  },
  storage: {
    usedGb: 25,
    maxGb: 100,
  },
  monthlyConversions: [],
};

const renderWithProviders = (initialEntries = ['/workspace/contact'], initialLocationState?: any) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[{ pathname: initialEntries[0], state: initialLocationState }]}>
        <Routes>
          <Route path="/workspace/contact" element={<WorkspaceContactPage />} />
          <Route path="/billing/upgrade" element={<div>Upgrade Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('WorkspaceContactPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUsageStats.mockResolvedValue(mockUsage);
  });

  it('renders Section A: PageHeader with title "Contact & Support"', async () => {
    renderWithProviders();

    expect(screen.getByRole('heading', { level: 1, name: /contact & support/i })).toBeInTheDocument();
    expect(
      screen.getByText(/get assistance with your workspace, screen conversion capacity, or enterprise modernization requirements/i)
    ).toBeInTheDocument();
  });

  it('renders Section B: Workspace Conversion Capacity metrics from real API', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/allocated screen capacity/i)).toBeInTheDocument();
    });

    expect(screen.getByText('500')).toBeInTheDocument(); // max screens
    expect(screen.getByText('120')).toBeInTheDocument(); // used screens
    expect(screen.getByText('380')).toBeInTheDocument(); // remaining screens
    expect(screen.getByText(/optimal/i)).toBeInTheDocument();
    expect(screen.getByText(/screen conversion capacity is allocated directly by alsm/i)).toBeInTheDocument();
  });

  it('renders Section C: 4 specialized contact channel cards', async () => {
    renderWithProviders();

    expect(screen.getByRole('heading', { name: /sales & service consultation/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /technical support/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /custom modernization/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /live team support/i })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /contact sales/i })).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:enterprise@alsm.io')
    );
    expect(screen.getByRole('link', { name: /contact support/i })).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:support@alsm.io')
    );
    expect(screen.getByRole('link', { name: /discuss requirements/i })).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:enterprise@alsm.io')
    );
  });

  it('dispatches "alsm:open-support-chat" event when clicking "Start Conversation"', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    renderWithProviders();

    const startChatBtn = screen.getByRole('button', { name: /start conversation/i });
    fireEvent.click(startChatBtn);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'alsm:open-support-chat' })
    );
    dispatchSpy.mockRestore();
  });

  it('dispatches "alsm:open-support-chat" event when clicking "Discuss Additional Capacity"', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /discuss additional capacity/i })).toBeInTheDocument();
    });

    const discussBtn = screen.getByRole('button', { name: /discuss additional capacity/i });
    fireEvent.click(discussBtn);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'alsm:open-support-chat' })
    );
    dispatchSpy.mockRestore();
  });

  it('renders Section D: Enterprise Modernization Capabilities', async () => {
    renderWithProviders();

    expect(screen.getByRole('heading', { name: /capacity limit scaling/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /custom parsers & dialects/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /on-premises & sla/i })).toBeInTheDocument();
  });

  it('does NOT render the obsolete request form with quota inputs', () => {
    renderWithProviders();

    expect(screen.queryByText(/send upgrade & technical request/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/your full name/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/target capacity needed/i)).not.toBeInTheDocument();
  });

  it('handles enterprise suspension appeal when appeal context is in location state', async () => {
    mocks.submitEnterpriseAppeal.mockResolvedValueOnce({ success: true });

    renderWithProviders(['/workspace/contact'], {
      appeal: {
        id: 'REQ-1234',
        companyName: 'Acme Bank Corp',
        reason: 'Monthly conversion quota exceeded beyond policy limits.',
      },
    });

    expect(screen.getByText(/enterprise suspension appeal/i)).toBeInTheDocument();
    expect(screen.getByText(/request #req-1234/i)).toBeInTheDocument();
    expect(screen.getAllByText(/monthly conversion quota exceeded beyond policy limits/i).length).toBeGreaterThan(0);

    const textarea = screen.getByPlaceholderText(/state the circumstances of your usage/i);
    expect(textarea).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /submit appeal to admin/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mocks.submitEnterpriseAppeal).toHaveBeenCalledWith(
        expect.stringContaining('REQ-1234')
      );
    });

    expect(
      screen.getByText(/your appeal has been forwarded to alsm compliance administrators/i)
    ).toBeInTheDocument();
  });
});
