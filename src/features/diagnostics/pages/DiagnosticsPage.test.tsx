import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { mockDiagnosticsLogs } from '@/mocks/diagnostics.mock';
import { DiagnosticsPage } from './DiagnosticsPage';

// diagnosticsService.getDiagnosticsLogs now hits the real backend and never falls back to
// mock data on failure — mock the service here instead (this is fixture data for the test,
// not a production fallback).
const mocks = vi.hoisted(() => ({
  getDiagnosticsLogs: vi.fn(),
  applyDiagnosticPatch: vi.fn(),
  escalateToSupport: vi.fn(),
  sendToManualReview: vi.fn(),
  downloadFullLog: vi.fn(),
}));

vi.mock('../services/diagnostics.service', () => ({
  diagnosticsService: {
    getDiagnosticsLogs: mocks.getDiagnosticsLogs,
    applyDiagnosticPatch: mocks.applyDiagnosticPatch,
    escalateToSupport: mocks.escalateToSupport,
    sendToManualReview: mocks.sendToManualReview,
    downloadFullLog: mocks.downloadFullLog,
  },
}));

describe('DiagnosticsPage', () => {
  const renderWithRouter = (initialRoute = '/projects/proj-acme/diagnostics') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/projects/:projectId/diagnostics" element={<DiagnosticsPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDiagnosticsLogs.mockResolvedValue(mockDiagnosticsLogs.map((l) => ({ ...l })));
    mocks.applyDiagnosticPatch.mockResolvedValue(undefined);
    mocks.downloadFullLog.mockReturnValue('log content');
  });

  it('renders heading, status pill badge, search, and action buttons', async () => {
    renderWithRouter();

    expect(await screen.findByRole('heading', { name: /(Diagnostics|Error Logs)/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download Full Log/i })).toBeInTheDocument();
  });

  it('renders log table entries and displays details for selected log', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /(Diagnostics|Error Logs)/i });

    expect(await screen.findByText('ERR_BMS_UNSUPPORTED_MACRO')).toBeInTheDocument();
    expect(screen.getByText('WARN_DEPRECATED_SYSCALL')).toBeInTheDocument();
    expect(screen.getByText('Source Code Snippet')).toBeInTheDocument();
    expect(screen.getByText('AI-Suggested Resolution')).toBeInTheDocument();
  });

  it('switches log selection when a row is clicked', async () => {
    renderWithRouter();

    await screen.findByText('WARN_DEPRECATED_SYSCALL');

    fireEvent.click(screen.getByText('WARN_DEPRECATED_SYSCALL'));

    expect(screen.getByText(/CALL 'SYSDAT' USING WS-SYS-DATE/i)).toBeInTheDocument();
  });

  it('filters logs by search input', async () => {
    renderWithRouter();

    await screen.findByText('ERR_BMS_UNSUPPORTED_MACRO');

    const searchInput = screen.getByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'WARN_DEPRECATED' } });

    expect(screen.getByText('WARN_DEPRECATED_SYSCALL')).toBeInTheDocument();
    expect(screen.queryByText('ERR_BMS_UNSUPPORTED_MACRO')).not.toBeInTheDocument();
  });

  it('applies a real diagnostic patch via the API when Apply Patch button is clicked', async () => {
    renderWithRouter();

    await screen.findByText('ERR_BMS_UNSUPPORTED_MACRO');

    const applyBtn = screen.getByRole('button', { name: /Apply Patch & Retry/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Patch Applied & Retried/i)).toBeInTheDocument();
    });
    expect(mocks.applyDiagnosticPatch).toHaveBeenCalledWith('diag-1', 'proj-acme');
  });

  it('shows a real error message (not fake data) when loading logs fails', async () => {
    mocks.getDiagnosticsLogs.mockRejectedValue(new Error('network down'));

    renderWithRouter();

    expect(await screen.findByText(/Could not load error logs/i)).toBeInTheDocument();
    expect(screen.queryByText('ERR_BMS_UNSUPPORTED_MACRO')).not.toBeInTheDocument();
  });

  it('shows a genuine empty state when the project truly has zero error logs', async () => {
    mocks.getDiagnosticsLogs.mockResolvedValue([]);

    renderWithRouter();

    expect(await screen.findByText(/No error logs matching your current filter/i)).toBeInTheDocument();
  });
});
