import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/features/auth/types/auth';
import { AppProviders, useAuth } from './providers';

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),

  getRefreshToken: vi.fn(),
  getAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
  setRefreshToken: vi.fn(),
  clearTokens: vi.fn(),
  handoff: vi.fn(),
  requiresPasswordChange: vi.fn(),
  onStoreChange: (() => {}) as () => void,

  refreshSession: vi.fn(),
  setAuthFailureHandler: vi.fn(),
}));

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: {
    getCurrentUser: mocks.getCurrentUser,
    login: mocks.login,
    register: mocks.register,
    loginWithGoogle: mocks.loginWithGoogle,
    logout: mocks.logout,
  },
}));

vi.mock('@/services/api/tokenStore', () => ({
  tokenStore: {
    epoch: () => 'epoch',
    subscribe: (listener: () => void) => { mocks.onStoreChange = listener; return () => {}; },
    requiresPasswordChange: mocks.requiresPasswordChange,
    isLogoutPending: () => false,
    getRefreshToken: mocks.getRefreshToken,
    getAccessToken: mocks.getAccessToken,
    setAccessToken: mocks.setAccessToken,
    setRefreshToken: mocks.setRefreshToken,
    clear: mocks.clearTokens,
    handoff: mocks.handoff,
  },
}));

vi.mock('@/services/api/apiClient', () => ({
  apiClient: {
    refreshSession: mocks.refreshSession,
    setAuthFailureHandler: mocks.setAuthFailureHandler,
  },
}));

function AuthStatus() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <p role="status">Loading authentication</p>;
  }

  return (
    <p>
      {user?.mustChangePassword ? `Restricted password change for ${user.email}` : isAuthenticated
        ? `Authenticated as ${user?.email}`
        : 'Unauthenticated'}
    </p>
  );
}

function renderWithProviders() {
  return render(
    <AppProviders>
      <AuthStatus />
    </AppProviders>,
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

const authenticatedUser: User = {
  id: 'user-1',
  fullName: 'Alex Vance',
  email: 'alex@example.com',
  role: 'USER',
};

describe('AppProviders authentication bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getRefreshToken.mockReturnValue(null);
    mocks.getAccessToken.mockReturnValue(null);
    mocks.requiresPasswordChange.mockReturnValue(false);
  });

  it('shows loading state while an existing session is being restored', () => {
    const refresh = deferred<{
      accessToken: string;
      refreshToken: string;
    }>();

    mocks.getRefreshToken.mockReturnValue('existing-refresh-token');
    mocks.refreshSession.mockReturnValue(refresh.promise);

    renderWithProviders();

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading authentication',
    );
  });

  it('exposes an authenticated user after successful session restoration', async () => {
    mocks.getRefreshToken.mockReturnValue('existing-refresh-token');

    mocks.refreshSession.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    mocks.getCurrentUser.mockResolvedValue(authenticatedUser);

    renderWithProviders();

    expect(
      await screen.findByText('Authenticated as alex@example.com'),
    ).toBeInTheDocument();

    expect(mocks.refreshSession).toHaveBeenCalledWith();

    expect(mocks.getCurrentUser).toHaveBeenCalled();
  });

  it('exposes an unauthenticated state when no refresh token exists', async () => {
    mocks.getRefreshToken.mockReturnValue(null);

    renderWithProviders();

    expect(
      await screen.findByText('Unauthenticated'),
    ).toBeInTheDocument();

    expect(mocks.refreshSession).not.toHaveBeenCalled();
    expect(mocks.getCurrentUser).not.toHaveBeenCalled();
  });

  it('restricts an already-restored identity when refresh requires a password change', async () => {
    mocks.getRefreshToken.mockReturnValue('existing-refresh-token');
    mocks.refreshSession.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
    mocks.getCurrentUser.mockResolvedValue(authenticatedUser);
    renderWithProviders();
    await screen.findByText('Authenticated as alex@example.com');
    mocks.requiresPasswordChange.mockReturnValue(true);
    mocks.getCurrentUser.mockResolvedValue({ ...authenticatedUser, mustChangePassword: true, roles: [] });
    act(() => mocks.onStoreChange());
    expect(await screen.findByText('Restricted password change for alex@example.com')).toBeInTheDocument();
    expect(mocks.clearTokens).not.toHaveBeenCalled();
  });

  it('redirects conversion staff to staff portal when session restores', async () => {
    mocks.getRefreshToken.mockReturnValue('existing-refresh-token');
    mocks.refreshSession.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    mocks.getCurrentUser.mockResolvedValue({
      ...authenticatedUser,
      roles: ['CONVERSION_STAFF'],
    });

    renderWithProviders();

    await vi.waitFor(() => {
      expect(mocks.handoff).toHaveBeenCalled();
    });
  });
});
