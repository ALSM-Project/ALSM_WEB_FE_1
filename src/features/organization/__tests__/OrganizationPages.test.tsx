import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import {
  OrganizationProfilePage,
  OrganizationMembersPage,
  OrganizationTeamsPage,
  OrganizationProjectsPage,
  OrganizationRolesPage,
  OrganizationAnalyticsPage,
  OrganizationAuditLogsPage,
} from '../pages/OrganizationPages';
import { companyLegalProfileService } from '@/features/account/services/companyLegalProfile.service';

vi.mock('@/app/providers', () => ({
  useAuth: () => ({
    user: {
      id: 'usr-enterprise-01',
      fullName: 'Enterprise Admin',
      email: 'partner@alsm.io',
      organizationId: 'org-enterprise-01',
      organizationName: 'FinTech Nexus Enterprise',
    },
  }),
}));

vi.mock('@/features/account/services/companyLegalProfile.service', () => ({
  companyLegalProfileService: {
    getTaxLookupStatus: vi.fn(),
    lookupTaxId: vi.fn(),
    getLegalProfile: vi.fn(),
    updateLegalProfile: vi.fn(),
  },
}));

describe('Enterprise Organisation Pages — Full Implementation & Layout Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (companyLegalProfileService.getTaxLookupStatus as any).mockResolvedValue({
      isConfigured: true,
      providerName: 'National Business Registry',
      supportedFormats: ['10-digit Enterprise Tax ID'],
    });
    (companyLegalProfileService.getLegalProfile as any).mockResolvedValue({
      organizationId: 'org-enterprise-01',
      organizationName: 'FinTech Nexus Enterprise',
      legalProfile: {
        taxId: '0109876543',
        legalCompanyName: 'FinTech Nexus Enterprise',
        registeredAddress: '123 Tech Park, Danang',
        legalRepresentative: 'Nguyen Duc Huy Hoang',
        representativeTitle: 'Authorized Signatory / Director',
        contactEmail: 'partner@alsm.io',
        verificationStatus: 'TAX_VERIFIED',
      },
    });
    (companyLegalProfileService.updateLegalProfile as any).mockResolvedValue({
      organizationId: 'org-enterprise-01',
      organizationName: 'Global FinTech Corp',
      legalProfile: {
        taxId: '0109876543',
        legalCompanyName: 'Global FinTech Corp',
        registeredAddress: '123 Tech Park, Danang',
        legalRepresentative: 'Nguyen Duc Huy Hoang',
        representativeTitle: 'Authorized Signatory / Director',
        contactEmail: 'partner@alsm.io',
        verificationStatus: 'TAX_VERIFIED',
      },
    });
  });

  // ─── 1. Organisation Profile ──────────────────────────────────────────────
  describe('OrganisationProfilePage', () => {
    it('renders with full width layout container (no narrow max-w-5xl) and loads data', async () => {
      const { container } = render(
        <MemoryRouter>
          <OrganizationProfilePage />
        </MemoryRouter>
      );

      // Wait until loading finishes and content is displayed
      await waitFor(() => {
        expect(screen.getByText(/1\. Enterprise Tax ID & Instant Lookup/i)).toBeInTheDocument();
      });

      // Verify layout class does not constrain width
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('space-y-6');
      expect(rootDiv.className).not.toContain('max-w-5xl');
      expect(rootDiv.className).not.toContain('mx-auto');

      // Verify section titles
      expect(screen.getByText(/2\. Registered Corporate Details/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. Authorized Legal Representative & Contract Notices/i)).toBeInTheDocument();
      expect(screen.getByText(/Legal Authority Notice & Disclaimer/i)).toBeInTheDocument();
      expect(screen.getByText(/Profile Summary/i)).toBeInTheDocument();

      // Verify save button exists
      expect(screen.getByText(/Save Company Legal Profile/i)).toBeInTheDocument();
    });

    it('handles editing organisation name and saving changes', async () => {
      render(
        <MemoryRouter>
          <OrganizationProfilePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue(/FinTech Nexus/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue(/FinTech Nexus/i);
      fireEvent.change(nameInput, { target: { value: 'Global FinTech Corp' } });
      expect(nameInput).toHaveValue('Global FinTech Corp');

      const saveBtn = screen.getByText(/Save Company Legal Profile/i);
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/Company legal profile successfully updated/i)).toBeInTheDocument();
      });
    });
  });

  // ─── 2. Team Members ──────────────────────────────────────────────────────
  describe('OrganizationMembersPage', () => {
    it('renders members data table with full available width', async () => {
      const { container } = render(
        <MemoryRouter>
          <OrganizationMembersPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
      });

      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('space-y-6');
      expect(rootDiv.className).not.toContain('max-w-5xl');

      expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
      expect(screen.getByText('Invite Member')).toBeInTheDocument();
    });

    it('filters member table by search query', async () => {
      render(
        <MemoryRouter>
          <OrganizationMembersPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search members/i);
      fireEvent.change(searchInput, { target: { value: 'Jenkins' } });

      expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
      expect(screen.queryByText('David Kim')).not.toBeInTheDocument();
    });
  });

  // ─── 3. Internal Teams ────────────────────────────────────────────────────
  describe('OrganizationTeamsPage', () => {
    it('renders squads grid in full responsive width', async () => {
      const { container } = render(
        <MemoryRouter>
          <OrganizationTeamsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Core Modernization Squad')).toBeInTheDocument();
      });

      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('space-y-6');
      expect(rootDiv.className).not.toContain('max-w-5xl');

      expect(screen.getByText('Create Team')).toBeInTheDocument();
    });
  });

  // ─── 4. Organisation Projects ─────────────────────────────────────────────
  describe('OrganizationProjectsPage', () => {
    it('renders organisation projects table and navigation links', async () => {
      const { container } = render(
        <MemoryRouter>
          <OrganizationProjectsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Acme Core Banking Modernization/i)).toBeInTheDocument();
      });

      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('space-y-6');
      expect(rootDiv.className).not.toContain('max-w-5xl');

      expect(screen.getAllByText('Workspace').length).toBeGreaterThan(0);
    });
  });

  // ─── 5. Roles & Permissions ───────────────────────────────────────────────
  describe('OrganizationRolesPage', () => {
    it('switches between Roles Inventory and Permissions Catalog tabs', async () => {
      const { container } = render(
        <MemoryRouter>
          <OrganizationRolesPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/System Administrator/i)).toBeInTheDocument();
      });

      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('space-y-6');
      expect(rootDiv.className).not.toContain('max-w-5xl');

      const permsTabBtn = screen.getByText(/Permission Catalog/i);
      fireEvent.click(permsTabBtn);

      await waitFor(() => {
        expect(screen.getByText('partner_portal.dashboard.view')).toBeInTheDocument();
      });
    });
  });

  // ─── 6. Organisation Analytics ────────────────────────────────────────────
  describe('OrganizationAnalyticsPage', () => {
    it('renders 4 KPI summary cards, pipeline stages, and CSV export action', async () => {
      const { container } = render(
        <MemoryRouter>
          <OrganizationAnalyticsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Converted Screens')).toBeInTheDocument();
      });

      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('space-y-6');
      expect(rootDiv.className).not.toContain('max-w-5xl');

      expect(screen.getByText('Rule Validation Health')).toBeInTheDocument();
      expect(screen.getByText('Active Workspaces')).toBeInTheDocument();
      expect(screen.getByText('Storage Utilisation')).toBeInTheDocument();
      expect(screen.getByText('Pipeline Stage Progression')).toBeInTheDocument();
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });
  });

  // ─── 7. Security Audit Logs ───────────────────────────────────────────────
  describe('OrganizationAuditLogsPage', () => {
    it('renders audit events table, pagination controls, and action filters', async () => {
      const { container } = render(
        <MemoryRouter>
          <OrganizationAuditLogsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('PROJECT_CREATED')).toBeInTheDocument();
      });

      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('space-y-6');
      expect(rootDiv.className).not.toContain('max-w-5xl');

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });
});
