import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActiveSession } from '../types/account';
import { sessionKeys } from '../queries/sessionKeys';
import { ActiveSessionsPage } from './ActiveSessionsPage';

const mocks = vi.hoisted(() => ({
  getActiveSessions: vi.fn(),
  revokeSession: vi.fn(),
  user: { id: 'user-a' } as { id: string } | null,
}));

vi.mock('../services/account.service', () => ({
  accountService: {
    getActiveSessions: mocks.getActiveSessions,
    revokeSession: mocks.revokeSession,
  },
}));

vi.mock('@/app/providers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

const sessions: ActiveSession[] = [
  {
    id: 'session-desktop',
    deviceType: 'Desktop',
    browser: 'Chrome',
    lastActiveAt: '2026-09-15T11:09:27.000Z',
    createdAt: '2026-09-01T09:00:00.000Z',
    expiresAt: '2026-10-01T09:00:00.000Z',
    isCurrent: false,
  },
  {
    id: 'session-mobile',
    deviceType: 'Mobile',
    browser: 'Safari',
    lastActiveAt: '2026-09-15T09:09:27.000Z',
    createdAt: '2026-09-02T09:00:00.000Z',
    expiresAt: '2026-10-02T09:00:00.000Z',
    isCurrent: true,
  },
];

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <ActiveSessionsPage />
    </QueryClientProvider>,
  );

  return { ...rendered, queryClient };
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
    mocks.user = { id: 'user-a' };
    mocks.getActiveSessions.mockResolvedValue(sessions);
    mocks.revokeSession.mockResolvedValue(undefined);
  });

  it('shows an accessible loading state while sessions load', () => {
    const loadingSessions = deferred<ActiveSession[]>();
    mocks.getActiveSessions.mockReturnValue(loadingSessions.promise);

    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Loading active sessions...');
  });

  it('renders the supported device, browser, and Vietnam-local last-active fields without fake network data', async () => {
    renderPage();

    expect(await screen.findByText('Desktop')).toBeInTheDocument();
    expect(screen.getByText('Chrome')).toBeInTheDocument();
    expect(screen.getByText('Last active: 15/09/2026 18:09')).toHaveAttribute('title', '15/09/2026 18:09:27 (GMT+7)');
    expect(screen.getByText('Mobile')).toBeInTheDocument();
    expect(screen.getByText('Safari')).toBeInTheDocument();
    expect(screen.queryByText('2026-09-15T11:09:27.000Z')).not.toBeInTheDocument();
    expect(screen.queryByText(/127\.0\.0\.1/)).not.toBeInTheDocument();
    expect(screen.queryByText(/IP:/)).not.toBeInTheDocument();
    expect(mocks.getActiveSessions).toHaveBeenCalledWith();
  });

  it('uses only the backend isCurrent flag to identify the current device', async () => {
    const matchingDeviceButNotCurrent: ActiveSession = {
      ...sessions[0],
      id: 'user-a',
      isCurrent: false,
    };
    mocks.getActiveSessions.mockResolvedValue([matchingDeviceButNotCurrent, sessions[1]]);

    renderPage();

    expect(await screen.findByText('Current device')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getAllByRole('status', { name: 'Current device status: active' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Remote logout for Desktop session using Chrome' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remote logout for Mobile session using Safari' })).not.toBeInTheDocument();
  });

  it('does not show Remote Logout for the current session', async () => {
    renderPage();

    await screen.findByText('Mobile');
    expect(screen.queryByRole('button', { name: 'Remote logout for Mobile session using Safari' })).not.toBeInTheDocument();
    expect(screen.getByText("This is the device you're currently using.")).toBeInTheDocument();
  });

  it('renders an invalid activity date with a safe fallback', async () => {
    mocks.getActiveSessions.mockResolvedValue([{ ...sessions[0], lastActiveAt: 'not-a-date' }]);

    renderPage();

    expect(await screen.findByText('Last active: Unavailable')).toBeInTheDocument();
    expect(screen.queryByText('not-a-date')).not.toBeInTheDocument();
  });

  it('renders a real empty state for an empty backend response', async () => {
    mocks.getActiveSessions.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('No active sessions found.')).toBeInTheDocument();
  });

  it('does not query sessions or expose bulk revocation before an authenticated user exists', async () => {
    mocks.user = null;

    renderPage();

    expect(await screen.findByText('No active sessions found.')).toBeInTheDocument();
    expect(mocks.getActiveSessions).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /revoke all other sessions/i })).not.toBeInTheDocument();
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

    const { queryClient } = renderPage();
    queryClient.setQueryData(sessionKeys.byUser('user-b'), sessions);
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    await screen.findByText('Desktop');
    fireEvent.click(screen.getByRole('button', { name: 'Remote logout for Desktop session using Chrome' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Desktop session using Chrome');

    fireEvent.click(screen.getByRole('button', { name: 'Confirm remote logout' }));

    await waitFor(() => {
      expect(mocks.revokeSession).toHaveBeenCalledWith('session-desktop');
      expect(mocks.getActiveSessions).toHaveBeenCalledTimes(2);
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: sessionKeys.byUser('user-a') });
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

  it('does not expose Revoke All Other Sessions', async () => {
    renderPage();

    await screen.findByText('Desktop');
    expect(screen.queryByText('Revoke All Other Sessions')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /revoke all other sessions/i })).not.toBeInTheDocument();
  });
});
