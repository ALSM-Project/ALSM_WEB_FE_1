import { render, screen } from '@testing-library/react';
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
    getRefreshToken: mocks.getRefreshToken,
    getAccessToken: mocks.getAccessToken,
    setAccessToken: mocks.setAccessToken,
    setRefreshToken: mocks.setRefreshToken,
    clear: mocks.clearTokens,
  },
}));

vi.mock('@/services/api/apiClient', () => ({
  apiClient: {
    post: mocks.refreshSession,
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
      {isAuthenticated
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

    expect(mocks.refreshSession).toHaveBeenCalledWith(
      '/auth/refresh',
      {
        refreshToken: 'existing-refresh-token',
      },
      {
        auth: false,
      },
    );

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
});