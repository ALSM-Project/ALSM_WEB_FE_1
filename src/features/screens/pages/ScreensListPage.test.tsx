import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LegacyScreen } from '../types/screen';
import { ScreensListPage } from './ScreensListPage';

const mocks = vi.hoisted(() => ({ getScreens: vi.fn() }));

vi.mock('@/features/conversion/services/conversion.service', () => ({
  conversionService: { getScreens: mocks.getScreens, deleteScreen: vi.fn() },
}));

function program(name: string, status: LegacyScreen['status']): LegacyScreen {
  return {
    id: name,
    projectId: 'p1',
    name,
    sourceType: 'COBOL',
    status,
    framework: 'React',
    lastUpdated: 'now',
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/projects/p1/screens']}>
      <Routes>
        <Route path="/projects/:projectId/screens" element={<ScreensListPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('ScreensListPage live refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.getScreens.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('re-fetches every 3s while a program is Processing and shows the new status without a reload', async () => {
    mocks.getScreens
      .mockResolvedValueOnce([program('A.cbl', 'Processing')])
      .mockResolvedValue([program('A.cbl', 'Completed')]);

    renderPage();
    await advance(0);
    expect(mocks.getScreens).toHaveBeenCalledTimes(1);

    await advance(3000);
    expect(mocks.getScreens).toHaveBeenCalledTimes(2);
  });

  it('polls slowly (10s) when nothing is converting', async () => {
    mocks.getScreens.mockResolvedValue([program('A.cbl', 'Completed')]);

    renderPage();
    await advance(0);
    expect(mocks.getScreens).toHaveBeenCalledTimes(1);

    await advance(9000);
    expect(mocks.getScreens).toHaveBeenCalledTimes(1);
    await advance(1000);
    expect(mocks.getScreens).toHaveBeenCalledTimes(2);
  });

  it('keeps the last good list when a background refresh fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.getScreens
      .mockResolvedValueOnce([program('KEEP.cbl', 'Processing')])
      .mockRejectedValue(new Error('network down'));

    renderPage();
    await advance(0);
    await advance(3000);

    expect(mocks.getScreens).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
    expect(screen.queryByText(/network down/i)).not.toBeInTheDocument();
  });
});
