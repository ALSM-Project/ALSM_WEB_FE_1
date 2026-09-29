import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { UsageStatsPage } from './UsageStatsPage';
import * as usageHooks from '../queries/useUsageStats';

vi.mock('../queries/useUsageStats');

const mockUseUsageStats = vi.mocked(usageHooks.useUsageStats);

describe('UsageStatsPage (UC-35)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <UsageStatsPage />
      </MemoryRouter>
    );
  };

  it('renders loading skeleton when fetching data', () => {
    mockUseUsageStats.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    const { container } = renderComponent();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders error state when request fails and allows retry', () => {
    const mockRefetch = vi.fn();
    mockUseUsageStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      refetch: mockRefetch,
    } as any);

    renderComponent();
    expect(screen.getByText('Failed to load service usage')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /Try again/i });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders header, plan badge, and quota metrics correctly for Starter plan', () => {
    mockUseUsageStats.mockReturnValue({
      data: {
        plan: { tier: 'STARTER', name: 'Starter' },
        screens: { used: 8, max: 10 },
        projects: { used: 1, max: 1 },
        storage: { usedGb: 0, maxGb: 5 },
        monthlyConversions: [
          { month: '2026-08', count: 4 },
          { month: '2026-09', count: 8 },
        ],
      },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    renderComponent();

    expect(screen.getByRole('heading', { name: /Service Usage/i })).toBeInTheDocument();
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('STARTER')).toBeInTheDocument();
    expect(screen.getByText('Screens / Month')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();

    // Check quota usage values (used and max are in separate spans)
    expect(screen.getAllByText('8').length).toBeGreaterThan(0);
    expect(screen.getByText('/ 10')).toBeInTheDocument();
    expect(screen.getByText('/ 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upgrade Plan/i })).toBeInTheDocument();
  });

  it('renders quota warning banner when quota limit is reached or exceeded', () => {
    mockUseUsageStats.mockReturnValue({
      data: {
        plan: { tier: 'STARTER', name: 'Starter' },
        screens: { used: 10, max: 10 },
        projects: { used: 1, max: 1 },
        storage: { usedGb: 0, maxGb: 5 },
        monthlyConversions: [],
      },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    renderComponent();

    expect(screen.getByText('You have reached your plan quota')).toBeInTheDocument();
    expect(screen.getByText(/Upgrade your plan to continue converting screens/i)).toBeInTheDocument();
  });

  it('renders unlimited indicators and no upgrade button for Enterprise tier', () => {
    mockUseUsageStats.mockReturnValue({
      data: {
        plan: { tier: 'ENTERPRISE', name: 'Enterprise Custom' },
        screens: { used: 150, max: -1 },
        projects: { used: 25, max: -1 },
        storage: { usedGb: 12, maxGb: -1 },
        monthlyConversions: [{ month: '2026-09', count: 150 }],
      },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    renderComponent();

    expect(screen.getByText('ENTERPRISE')).toBeInTheDocument();
    expect(screen.getByText('Unlimited resources — Enterprise plan')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Upgrade Plan/i })).not.toBeInTheDocument();
    expect(screen.getAllByText('Unlimited').length).toBeGreaterThan(0);
  });

  it('renders monthly conversions activity section with data', () => {
    mockUseUsageStats.mockReturnValue({
      data: {
        plan: { tier: 'PROFESSIONAL', name: 'Professional' },
        screens: { used: 25, max: 100 },
        projects: { used: 3, max: 10 },
        storage: { usedGb: 1.5, maxGb: 50 },
        monthlyConversions: [
          { month: '2026-08', count: 12 },
          { month: '2026-09', count: 25 },
        ],
      },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    renderComponent();

    expect(screen.getByText('Monthly Conversion Volume')).toBeInTheDocument();
    expect(screen.getByText('2026-08')).toBeInTheDocument();
    expect(screen.getByText('2026-09')).toBeInTheDocument();
  });

  it('renders empty chart message when no monthly conversions exist', () => {
    mockUseUsageStats.mockReturnValue({
      data: {
        plan: { tier: 'STARTER', name: 'Starter' },
        screens: { used: 0, max: 10 },
        projects: { used: 0, max: 1 },
        storage: { usedGb: 0, maxGb: 5 },
        monthlyConversions: [],
      },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    renderComponent();

    expect(screen.getByText('No conversion activity yet')).toBeInTheDocument();
  });
});
