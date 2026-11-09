import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Project } from '../types/project';
import { ModernizationDashboardPage } from './ModernizationDashboardPage';

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Mortgage Modernization',
    description: 'Modernizing legacy BMS maps',
    status: 'ACTIVE',
    conversionType: 'BMS_DSPF_TO_FRONTEND',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-10T10:00:00Z',
  },
  {
    id: 'proj-2',
    name: 'Payroll Modernization',
    description: 'COBOL to Java migration',
    status: 'DRAFT',
    conversionType: 'COBOL_TO_JAVA',
    createdAt: '2026-08-02T10:00:00Z',
    updatedAt: '2026-08-09T10:00:00Z',
  },
];

const mocks = vi.hoisted(() => ({
  getProjects: vi.fn(),
  getScreens: vi.fn(),
  getUsageStats: vi.fn(),
  getCurrentSubscription: vi.fn(),
  getContracts: vi.fn(),
  getMyQuoteRequest: vi.fn(),
}));

vi.mock('../services/project.service', () => ({
  projectService: {
    getProjects: mocks.getProjects,
  },
}));

vi.mock('@/features/conversion/services/conversion.service', () => ({
  conversionService: {
    getScreens: mocks.getScreens,
  },
}));

vi.mock('@/features/billing/services/billing.service', () => ({
  billingService: {
    getUsageStats: mocks.getUsageStats,
    getCurrentSubscription: mocks.getCurrentSubscription,
    getContracts: mocks.getContracts,
    getMyQuoteRequest: mocks.getMyQuoteRequest,
  },
}));

describe('ModernizationDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUsageStats.mockResolvedValue({
      plan: { tier: 'ENTERPRISE', name: 'Enterprise' },
      screens: { used: 32, max: 100 },
      programs: { used: 3, max: 50 },
      projects: { used: 2, max: 10 },
      storage: { usedGb: 2.5, maxGb: 20 },
      monthlyConversions: [],
    });
    mocks.getCurrentSubscription.mockResolvedValue({
      id: 'sub-1',
      planId: 'plan-ent',
      planName: 'Enterprise',
      tier: 'enterprise',
      status: 'ACTIVE',
      billingCycle: 'monthly',
      currentPeriodStart: '2026-08-01T00:00:00Z',
      currentPeriodEnd: '2026-08-31T23:59:59Z',
      cancelAtPeriodEnd: false,
    });
    mocks.getContracts.mockResolvedValue({
      items: [
        {
          id: 'contract-1',
          contractNumber: 'ALSM-2026-0042',
          plan: 'Enterprise Managed',
          status: 'ACTIVE',
          paymentStatus: 'PAID',
          customerSigningStatus: 'SIGNED',
          effectiveDate: '2026-08-01T00:00:00Z',
          expirationDate: '2027-08-01T00:00:00Z',
          scope: {
            screensQuota: 100,
            programsQuota: 50,
            storageGb: 20,
          },
        },
      ],
    });
    mocks.getMyQuoteRequest.mockResolvedValue(null);
    mocks.getScreens.mockResolvedValue([
      {
        id: 'scr-1',
        projectId: 'proj-1',
        name: 'ACCT010',
        sourceType: 'BMS',
        status: 'Completed',
        framework: 'React',
        lastUpdated: '2026-08-10T12:00:00Z',
      },
      {
        id: 'scr-2',
        projectId: 'proj-1',
        name: 'ACCT020',
        sourceType: 'BMS',
        status: 'Review Required',
        framework: 'React',
        lastUpdated: '2026-08-10T13:00:00Z',
      },
    ]);
  });

  const renderPage = () => {
    return render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<ModernizationDashboardPage />} />
          <Route path="/projects" element={<div>Projects List Page</div>} />
          <Route path="/projects/:projectId" element={<div>Project Detail Page</div>} />
          <Route path="/billing/usage" element={<div>Usage Stats Page</div>} />
          <Route path="/contracts" element={<div>Contracts List Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders compact workspace header, real KPI cards, and recent projects table', async () => {
    mocks.getProjects.mockResolvedValue(mockProjects);
    renderPage();

    // 1. Compact Dashboard Header
    expect(await screen.findByRole('heading', { name: /^Workspace Dashboard$/i })).toBeInTheDocument();
    expect(screen.getByText(/Monitor your modernization projects, conversion progress, and service usage/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Project/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();

    // 2. Four KPI Cards
    const totalProjectsCard = screen.getByTitle('Click to view all projects');
    expect(totalProjectsCard).toHaveTextContent('2');

    const inProgressCard = screen.getByTitle('Click to view in-progress projects');
    expect(inProgressCard).toHaveTextContent('1');

    const completedCard = screen.getByTitle('Click to view completed projects');
    expect(completedCard).toHaveTextContent('0');

    const actionRequiredCard = screen.getByTitle('Click to view projects requiring action');
    expect(actionRequiredCard).toBeInTheDocument();

    // 3. Recent Projects Structured List / Table
    expect(screen.getAllByText('Mortgage Modernization').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Payroll Modernization').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('View All Projects')).toBeInTheDocument();
    expect(screen.getAllByText('Open Project').length).toBeGreaterThanOrEqual(1);
  });

  it('renders clean empty state when user has no projects', async () => {
    mocks.getProjects.mockResolvedValue([]);
    mocks.getScreens.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('No Projects Yet')).toBeInTheDocument();
    expect(screen.getByText(/You haven't created any modernization projects yet/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Create Project/i }).length).toBeGreaterThanOrEqual(2);
  });

  it('renders Enterprise Contract & Service Overview with usage quotas and links', async () => {
    mocks.getProjects.mockResolvedValue(mockProjects);
    renderPage();

    expect(await screen.findByText('Enterprise Contract & Service Overview')).toBeInTheDocument();
    expect(screen.getByText('ALSM-2026-0042')).toBeInTheDocument();
    expect(screen.getByText('Screen Conversion Usage')).toBeInTheDocument();
    expect(screen.getByText('Program Conversion Usage')).toBeInTheDocument();
    expect(screen.getByText('Storage Usage')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Contract/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Usage/i })).toBeInTheDocument();
  });

  it('renders Action Required items when pending validations exist', async () => {
    mocks.getProjects.mockResolvedValue(mockProjects);
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Validation Required').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Mortgage Modernization/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders clean empty state in Action Required when no items are pending', async () => {
    mocks.getProjects.mockResolvedValue([mockProjects[1]]); // Draft project with no screens
    mocks.getScreens.mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("No actions required.")).toBeInTheDocument();
    });
  });

  it('renders Recent Activity records', async () => {
    mocks.getProjects.mockResolvedValue(mockProjects);
    renderPage();

    expect(await screen.findByText('Recent Activity')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText(/Project created/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});
