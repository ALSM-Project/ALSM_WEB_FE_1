import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActiveSession } from '../types/account';
import { ActiveSessionsPage } from './ActiveSessionsPage';

const mocks = vi.hoisted(() => ({
  getActiveSessions: vi.fn(),
  revokeSession: vi.fn(),
  revokeAllOtherSessions: vi.fn(),
}));

vi.mock('../services/account.service', () => ({
  accountService: {
    getActiveSessions: mocks.getActiveSessions,
    revokeSession: mocks.revokeSession,
    revokeAllOtherSessions: mocks.revokeAllOtherSessions,
  },
}));

const sessions: ActiveSession[] = [
  {
    id: 'session-desktop',
    deviceType: 'Desktop',
    browser: 'Chrome',
    lastActiveAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    createdAt: '2026-09-01T09:00:00.000Z',
    expiresAt: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'session-mobile',
    deviceType: 'Mobile',
    browser: 'Safari',
    lastActiveAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    createdAt: '2026-09-02T09:00:00.000Z',
    expiresAt: '2026-10-02T09:00:00.000Z',
  },
];

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ActiveSessionsPage />
    </QueryClientProvider>,
  );
};

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
};

describe('ActiveSessionsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getActiveSessions.mockResolvedValue(sessions);
    mocks.revokeSession.mockResolvedValue(undefined);
    mocks.revokeAllOtherSessions.mockResolvedValue(undefined);
  });

  it('shows an accessible loading state while sessions load', () => {
    const loadingSessions = deferred<ActiveSession[]>();
    mocks.getActiveSessions.mockReturnValue(loadingSessions.promise);

    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Loading active sessions...');
  });

  it('renders the supported device, browser, and last-active fields without fake network data', async () => {
    renderPage();

    expect(await screen.findByText('Desktop')).toBeInTheDocument();
    expect(screen.getByText('Chrome')).toBeInTheDocument();
    expect(screen.getByText(/Last active: 5 minutes ago/)).toBeInTheDocument();
    expect(screen.getByText('Mobile')).toBeInTheDocument();
    expect(screen.getByText('Safari')).toBeInTheDocument();
    expect(screen.queryByText(/127\.0\.0\.1/)).not.toBeInTheDocument();
    expect(screen.queryByText(/IP:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/This Device/)).not.toBeInTheDocument();
  });

  it('renders a real empty state for an empty backend response', async () => {
    mocks.getActiveSessions.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('No active sessions found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Revoke all other sessions' })).toBeDisabled();
  });

  it('shows a safe error when the session list request fails', async () => {
    mocks.getActiveSessions.mockRejectedValue(new Error('backend internals'));

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not load your active sessions.');
    expect(screen.queryByText('backend internals')).not.toBeInTheDocument();
  });

  it('revokes the selected session and refreshes the active-session query after success', async () => {
    mocks.getActiveSessions
      .mockResolvedValueOnce(sessions)
      .mockResolvedValueOnce([sessions[1]]);

    renderPage();

    await screen.findByText('Desktop');
    fireEvent.click(screen.getByRole('button', { name: 'Remote logout for Desktop session using Chrome' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Desktop session using Chrome');

    fireEvent.click(screen.getByRole('button', { name: 'Confirm remote logout' }));

    await waitFor(() => {
      expect(mocks.revokeSession).toHaveBeenCalledWith('session-desktop');
      expect(mocks.getActiveSessions).toHaveBeenCalledTimes(2);
    });
    expect(screen.queryByText('Desktop')).not.toBeInTheDocument();
  });

  it('keeps the revoke action pending and prevents duplicate submission', async () => {
    const revoke = deferred<void>();
    mocks.revokeSession.mockReturnValue(revoke.promise);

    renderPage();

    await screen.findByText('Desktop');
    fireEvent.click(screen.getByRole('button', { name: 'Remote logout for Desktop session using Chrome' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm remote logout' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Confirm remote logout' })).toBeDisabled();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm remote logout' }));
    expect(mocks.revokeSession).toHaveBeenCalledTimes(1);
  });

  it('shows a safe error when remote logout fails', async () => {
    mocks.revokeSession.mockRejectedValue(new Error('sensitive backend detail'));

    renderPage();

    await screen.findByText('Desktop');
    fireEvent.click(screen.getByRole('button', { name: 'Remote logout for Desktop session using Chrome' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm remote logout' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not revoke that session.');
    expect(screen.queryByText('sensitive backend detail')).not.toBeInTheDocument();
  });

  it('revokes all other sessions through the real mutation flow', async () => {
    mocks.getActiveSessions
      .mockResolvedValueOnce(sessions)
      .mockResolvedValueOnce([sessions[0]]);

    renderPage();

    await screen.findByText('Desktop');
    fireEvent.click(screen.getByRole('button', { name: 'Revoke all other sessions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm revoking all other sessions' }));

    await waitFor(() => {
      expect(mocks.revokeAllOtherSessions).toHaveBeenCalledTimes(1);
      expect(mocks.getActiveSessions).toHaveBeenCalledTimes(2);
    });
  });
});
