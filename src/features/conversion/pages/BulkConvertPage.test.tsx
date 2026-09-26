import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { BulkConvertPage } from './BulkConvertPage';

// Regression test: a real backend failure when starting a bulk conversion (e.g. the queue
// is unavailable) used to be completely silent — no error, no navigation, nothing. It
// looked identical to the button doing nothing at all.
const mocks = vi.hoisted(() => ({
  getScreens: vi.fn(),
  bulkConvertScreens: vi.fn(),
}));

vi.mock('../services/conversion.service', () => ({
  conversionService: {
    getScreens: mocks.getScreens,
    bulkConvertScreens: mocks.bulkConvertScreens,
  },
}));

const screens: LegacyScreen[] = [
  { id: 'scr-1', projectId: 'proj-acme', name: 'LOGIN.bms', sourceType: 'BMS', status: 'Ready', framework: 'React', lastUpdated: 'just now' },
  { id: 'scr-2', projectId: 'proj-acme', name: 'ACCT.cbl', sourceType: 'COBOL', status: 'Ready', framework: 'React', lastUpdated: 'just now' },
];

describe('BulkConvertPage', () => {
  const renderPage = () =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/projects/proj-acme/bulk-convert']}>
          <Routes>
            <Route path="/projects/:projectId/bulk-convert" element={<BulkConvertPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  it('shows a real error banner when starting the bulk conversion fails', async () => {
    mocks.getScreens.mockResolvedValue(screens);
    mocks.bulkConvertScreens.mockRejectedValue(new Error('Conversion job could not be queued'));

    renderPage();
    const startButton = await screen.findByRole('button', { name: /Start Conversion/i });
    fireEvent.click(startButton);

    expect(await screen.findByText('Conversion job could not be queued')).toBeInTheDocument();
  });

  it('shows no error banner when starting the bulk conversion succeeds', async () => {
    mocks.getScreens.mockResolvedValue(screens);
    mocks.bulkConvertScreens.mockResolvedValue([
      { id: 'job-1', screenId: 'scr-1', status: 'QUEUED', createdAt: '2026-09-25T00:00:00.000Z' },
      { id: 'job-2', screenId: 'scr-2', status: 'QUEUED', createdAt: '2026-09-25T00:00:00.000Z' },
    ]);

    renderPage();
    const startButton = await screen.findByRole('button', { name: /Start Conversion/i });
    fireEvent.click(startButton);

    await screen.findByRole('button', { name: /Start Conversion/i });
    expect(screen.queryByText(/Could not start/i)).not.toBeInTheDocument();
  });
});
