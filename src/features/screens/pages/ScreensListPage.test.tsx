import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { LegacyScreen } from '../types/screen';
import { ScreensListPage } from './ScreensListPage';

const mocks = vi.hoisted(() => ({
  getScreens: vi.fn(),
  deleteScreen: vi.fn(),
  getCopybookDependencies: vi.fn(),
  getProjectById: vi.fn(),
}));

vi.mock('@/features/conversion/services/conversion.service', () => ({
  conversionService: {
    getScreens: mocks.getScreens,
    deleteScreen: mocks.deleteScreen,
    getCopybookDependencies: mocks.getCopybookDependencies,
  },
}));

vi.mock('@/features/projects/services/project.service', () => ({
  projectService: {
    getProjectById: mocks.getProjectById,
  },
}));

const mockScreens: LegacyScreen[] = [
  {
    id: 'scr-1',
    projectId: 'proj-123',
    name: 'ACCT01.bms',
    sourceType: 'BMS',
    status: 'Ready',
    framework: 'React',
    lastUpdated: '2026-08-01 12:00:00',
    sizeKb: 14,
  },
  {
    id: 'scr-2',
    projectId: 'proj-123',
    name: 'CUST01.dspf',
    sourceType: 'DSPF',
    status: 'Completed',
    framework: 'React',
    lastUpdated: '2026-08-02 12:00:00',
    sizeKb: 20,
  },
  {
    id: 'scr-3',
    projectId: 'proj-123',
    name: 'ERR01.bms',
    sourceType: 'BMS',
    status: 'Failed',
    framework: 'React',
    lastUpdated: '2026-08-03 12:00:00',
    sizeKb: 8,
  },
  {
    id: 'prg-1',
    projectId: 'proj-123',
    name: 'CBACT01C.cbl',
    sourceType: 'COBOL',
    status: 'Ready',
    framework: 'React',
    lastUpdated: '2026-08-04 12:00:00',
    sizeKb: 45,
  },
  {
    id: 'prg-2',
    projectId: 'proj-123',
    name: 'CBPAY02C.cbl',
    sourceType: 'COBOL',
    status: 'Review Required',
    framework: 'React',
    lastUpdated: '2026-08-05 12:00:00',
    sizeKb: 52,
  },
];

describe('ScreensListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProjectById.mockImplementation((id: string) => {
      if (id.includes('cobol') || id === 'proj-cobol') {
        return Promise.resolve({ id, conversionType: 'COBOL_TO_JAVA' });
      }
      return Promise.resolve({ id, conversionType: 'BMS_DSPF_TO_FRONTEND' });
    });
  });

  const renderPage = (projectId = 'proj-123', query = '') => {
    return render(
      <MemoryRouter initialEntries={[`/projects/${projectId}/screens${query}`]}>
        <Routes>
          <Route path="/projects/:projectId/screens" element={<ScreensListPage />} />
          <Route path="/projects/:projectId/screens/bulk-convert" element={<div>Bulk Convert Page</div>} />
          <Route path="/projects/:projectId/upload" element={<div>Upload Page</div>} />
          <Route path="/projects/:projectId/diagnostics" element={<div>Diagnostics Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders screens workspace with header, metrics, and screen assets', async () => {
    mocks.getProjectById.mockResolvedValue({ id: 'proj-123', conversionType: 'BMS_DSPF_TO_FRONTEND' });
    mocks.getScreens.mockResolvedValue(mockScreens);
    renderPage();

    expect(await screen.findByText('ACCT01.bms')).toBeInTheDocument();
    expect(screen.getByText('Screens Workspace')).toBeInTheDocument();
    expect(screen.getByText('CUST01.dspf')).toBeInTheDocument();
    expect(screen.getByText('ERR01.bms')).toBeInTheDocument();

    // Total Assets metric card for screens
    expect(screen.getByTitle('Click to view all assets')).toBeInTheDocument();
    expect(screen.getByText('3 Screens')).toBeInTheDocument();
  });

  it('renders COBOL programs workspace for dedicated COBOL project', async () => {
    mocks.getProjectById.mockResolvedValue({ id: 'proj-cobol', conversionType: 'COBOL_TO_JAVA' });
    mocks.getScreens.mockResolvedValue(mockScreens);
    renderPage('proj-cobol', '?stage=convert');

    expect(await screen.findByText('CBACT01C.cbl')).toBeInTheDocument();
    expect(screen.getByText('Programs Workspace')).toBeInTheDocument();
    expect(screen.getByText('CBPAY02C.cbl')).toBeInTheDocument();
    expect(screen.queryByText('ACCT01.bms')).not.toBeInTheDocument();
    expect(screen.getByText('2 Programs')).toBeInTheDocument();
  });

  it('filters assets by search query', async () => {
    mocks.getScreens.mockResolvedValue(mockScreens);
    renderPage();

    expect(await screen.findByText('ACCT01.bms')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search legacy screens by name/i);
    fireEvent.change(searchInput, { target: { value: 'CUST' } });

    expect(screen.getByText('CUST01.dspf')).toBeInTheDocument();
    expect(screen.queryByText('ACCT01.bms')).not.toBeInTheDocument();
    expect(screen.queryByText('ERR01.bms')).not.toBeInTheDocument();
  });

  it('filters assets by status dropdown and metric cards', async () => {
    mocks.getScreens.mockResolvedValue(mockScreens);
    renderPage();

    expect(await screen.findByText('ACCT01.bms')).toBeInTheDocument();

    // Filter via dropdown
    const statusSelect = screen.getByLabelText('Filter by status');
    fireEvent.change(statusSelect, { target: { value: 'COMPLETED' } });

    expect(screen.getByText('CUST01.dspf')).toBeInTheDocument();
    expect(screen.queryByText('ACCT01.bms')).not.toBeInTheDocument();

    // Filter via metric card "Total Assets" (resets to ALL)
    fireEvent.click(screen.getByTitle('Click to view all assets'));
    expect(await screen.findByText('ACCT01.bms')).toBeInTheDocument();
    expect(screen.getByText('CUST01.dspf')).toBeInTheDocument();
  });

  it('supports pagination page-size changes', async () => {
    mocks.getScreens.mockResolvedValue(mockScreens);
    renderPage();

    expect(await screen.findByText('ACCT01.bms')).toBeInTheDocument();
    expect(screen.getByText(/Showing 1–3 of 3 legacy screens/i)).toBeInTheDocument();

    const pageSizeSelect = screen.getByDisplayValue('20');
    fireEvent.change(pageSizeSelect, { target: { value: '10' } });

    expect(screen.getByText(/Showing 1–3 of 3 legacy screens/i)).toBeInTheDocument();
  });

  it('triggers bulk convert action from header', async () => {
    mocks.getScreens.mockResolvedValue(mockScreens);
    renderPage();

    expect(await screen.findByText('ACCT01.bms')).toBeInTheDocument();

    const bulkConvertBtn = screen.getByRole('button', { name: /Bulk Convert/i });
    fireEvent.click(bulkConvertBtn);

    expect(await screen.findByText('Bulk Convert Page')).toBeInTheDocument();
  });

  it('shows method mapping and dependencies for COBOL programs', async () => {
    const cobolScreens: LegacyScreen[] = [
      {
        id: 'prg-1',
        projectId: 'proj-cobol',
        name: 'CBACT01C.cbl',
        sourceType: 'COBOL',
        status: 'Ready',
        framework: 'React',
        lastUpdated: '2026-08-04 12:00:00',
        sizeKb: 45,
      },
      {
        id: 'prg-2',
        projectId: 'proj-cobol',
        name: 'CBPAY02C.cbl',
        sourceType: 'COBOL',
        status: 'Failed',
        framework: 'React',
        lastUpdated: '2026-08-05 12:00:00',
        sizeKb: 52,
      },
    ];

    mocks.getProjectById.mockResolvedValue({ id: 'proj-cobol', conversionType: 'COBOL_TO_JAVA' });
    mocks.getScreens.mockResolvedValue(cobolScreens);
    mocks.getCopybookDependencies.mockResolvedValue({
      program: 'CBPAY02C.cbl',
      status: 'READY_FOR_CONVERSION',
      dependencies: [],
    });
    renderPage('proj-cobol', '?stage=convert');

    expect(await screen.findByText('CBACT01C.cbl')).toBeInTheDocument();
    expect(screen.getByText('Programs Workspace')).toBeInTheDocument();
    expect(screen.getByText('CBPAY02C.cbl')).toBeInTheDocument();

    // Check for Method Mapping link for ready program
    expect(screen.getByTitle('Inspect Paragraph-to-Method Mapping')).toBeInTheDocument();

    // Check for Dependencies button for failed program
    const depButton = screen.getByTitle('View copybook dependency diagnostics');
    expect(depButton).toBeInTheDocument();

    // Open dependencies modal
    fireEvent.click(depButton);
    expect(mocks.getCopybookDependencies).toHaveBeenCalledWith('prg-2');
  });

  it('opens delete confirmation modal and deletes a screen on confirm', async () => {
    mocks.getScreens.mockResolvedValue(mockScreens);
    mocks.deleteScreen.mockResolvedValue(true);
    renderPage();

    expect(await screen.findByText('ACCT01.bms')).toBeInTheDocument();

    // Click delete on ACCT01.bms
    const deleteBtn = screen.getByLabelText('Delete ACCT01.bms');
    fireEvent.click(deleteBtn);

    expect(screen.getByRole('heading', { name: 'Delete Screen' })).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();

    // Confirm deletion
    const confirmDeleteBtn = screen.getByRole('button', { name: 'Delete Screen' });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(mocks.deleteScreen).toHaveBeenCalledWith('proj-123', 'scr-1');
    });
  });

  it('surfaces an error message when deletion fails', async () => {
    mocks.getScreens.mockResolvedValue(mockScreens);
    mocks.deleteScreen.mockResolvedValue(false);
    renderPage();

    expect(await screen.findByText('ACCT01.bms')).toBeInTheDocument();

    const deleteBtn = screen.getByLabelText('Delete ACCT01.bms');
    fireEvent.click(deleteBtn);

    const confirmDeleteBtn = screen.getByRole('button', { name: 'Delete Screen' });
    fireEvent.click(confirmDeleteBtn);

    expect(await screen.findByText('Failed to delete screen. Please try again.')).toBeInTheDocument();
  });

  it('displays loading state and error state with retry', async () => {
    mocks.getScreens.mockRejectedValueOnce(new Error('Backend offline'));
    renderPage();

    expect(await screen.findByText('Failed to load project assets')).toBeInTheDocument();
    expect(screen.getByText('Backend offline')).toBeInTheDocument();

    mocks.getScreens.mockResolvedValue(mockScreens);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('ACCT01.bms')).toBeInTheDocument();
  });
});
