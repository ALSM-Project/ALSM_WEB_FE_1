import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LegacyScreen, ScreenStatus } from '../types/screen';
import { ScreensListPage } from './ScreensListPage';

const mocks = vi.hoisted(() => ({
  getScreens: vi.fn(),
  bulkConvertScreens: vi.fn(),
  deleteScreen: vi.fn(),
}));

vi.mock('@/features/conversion/services/conversion.service', () => ({
  conversionService: {
    getScreens: mocks.getScreens,
    bulkConvertScreens: mocks.bulkConvertScreens,
    deleteScreen: mocks.deleteScreen,
  },
}));

const program = (id: string, status: ScreenStatus): LegacyScreen => ({
  id,
  projectId: 'p1',
  name: `${id.toUpperCase()}.cbl`,
  sourceType: 'COBOL',
  status,
  framework: 'Java (Spring Boot)',
  lastUpdated: 'now',
});

function renderPage(state?: unknown) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[{ pathname: '/projects/p1/screens', state }]}>
        <Routes>
          <Route path="/projects/:projectId/screens" element={<ScreensListPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Lets pending promises settle and moves the clock. */
const tick = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

/** Status badges in the table rows (the filter list also has these words). */
const statusCells = (label: string) => screen.queryAllByText(label).filter((el) => el.closest('td'));

const openProgramsTab = () => fireEvent.click(screen.getByRole('button', { name: /COBOL Programs/i }));

describe('ScreensListPage auto-refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.getScreens.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('refreshes every 3 seconds while a program is processing, with no reload', async () => {
    mocks.getScreens
      .mockResolvedValueOnce([program('a', 'Processing'), program('b', 'Ready')])
      .mockResolvedValueOnce([program('a', 'Completed'), program('b', 'Processing')])
      .mockResolvedValue([program('a', 'Completed'), program('b', 'Completed')]);
    renderPage();
    await tick(0);
    openProgramsTab();
    expect(mocks.getScreens).toHaveBeenCalledTimes(1);
    expect(statusCells('Processing')).toHaveLength(1);

    await tick(3000);
    expect(mocks.getScreens).toHaveBeenCalledTimes(2);
    expect(statusCells('Completed')).toHaveLength(1);

    await tick(3000);
    expect(mocks.getScreens).toHaveBeenCalledTimes(3);
    expect(statusCells('Completed')).toHaveLength(2);
  });

  it('stops refreshing once every program is done', async () => {
    mocks.getScreens
      .mockResolvedValueOnce([program('a', 'Processing')])
      .mockResolvedValue([program('a', 'Completed')]);
    renderPage();
    await tick(0);
    await tick(3000);
    const calls = mocks.getScreens.mock.calls.length;
    expect(calls).toBe(2);

    await tick(30000);
    expect(mocks.getScreens).toHaveBeenCalledTimes(calls);
  });

  it('never refreshes a list with nothing running', async () => {
    mocks.getScreens.mockResolvedValue([program('a', 'Ready'), program('b', 'Completed')]);
    renderPage();
    await tick(0);
    await tick(30000);
    expect(mocks.getScreens).toHaveBeenCalledTimes(1);
  });

  it('shows the screens handed over by the bulk-convert page as queued and follows them to the end', async () => {
    mocks.getScreens
      .mockResolvedValueOnce([program('a', 'Ready'), program('b', 'Ready'), program('c', 'Ready')])
      .mockResolvedValueOnce([program('a', 'Processing'), program('b', 'Ready'), program('c', 'Ready')])
      .mockResolvedValue([program('a', 'Completed'), program('b', 'Completed'), program('c', 'Completed')]);
    renderPage({ startPolling: true, screenIds: ['a', 'b', 'c'] });
    await tick(0);
    openProgramsTab();
    // Ready on the server, but they were just sent: all three show as queued.
    expect(statusCells('Queued')).toHaveLength(3);

    await tick(3000);
    expect(statusCells('Processing')).toHaveLength(1);
    expect(statusCells('Queued')).toHaveLength(2);

    await tick(3000);
    expect(statusCells('Completed')).toHaveLength(3);
    const calls = mocks.getScreens.mock.calls.length;
    await tick(30000);
    expect(mocks.getScreens).toHaveBeenCalledTimes(calls);
  });

  it('keeps the search text and the selected tab across refreshes', async () => {
    mocks.getScreens.mockResolvedValue([program('alpha', 'Processing'), program('beta', 'Processing')]);
    renderPage();
    await tick(0);
    openProgramsTab();
    fireEvent.change(screen.getByPlaceholderText(/Search COBOL programs/i), { target: { value: 'alp' } });
    await tick(3000);
    await tick(3000);
    expect(screen.getByPlaceholderText(/Search COBOL programs/i)).toHaveValue('alp');
    expect(screen.getByText('ALPHA.cbl')).toBeInTheDocument();
    expect(screen.queryByText('BETA.cbl')).not.toBeInTheDocument();
  });

  it('clears its timer when the page is closed', async () => {
    mocks.getScreens.mockResolvedValue([program('a', 'Processing')]);
    const view = renderPage();
    await tick(0);
    view.unmount();
    const calls = mocks.getScreens.mock.calls.length;
    await tick(30000);
    expect(mocks.getScreens).toHaveBeenCalledTimes(calls);
  });

  it('keeps what is shown when a background refresh fails and tries again', async () => {
    mocks.getScreens
      .mockResolvedValueOnce([program('a', 'Processing')])
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue([program('a', 'Completed')]);
    renderPage();
    await tick(0);
    openProgramsTab();
    await tick(3000);
    expect(statusCells('Processing')).toHaveLength(1);
    await tick(3000);
    expect(statusCells('Completed')).toHaveLength(1);
  });
});
