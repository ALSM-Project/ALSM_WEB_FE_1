import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/features/auth/types/auth';
import { AppProviders, useAuth } from './providers';

const authMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: {
    getCurrentUser: authMocks.getCurrentUser,
    login: authMocks.login,
    register: authMocks.register,
    logout: authMocks.logout,
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
    authMocks.getCurrentUser.mockReset();
    authMocks.login.mockReset();
    authMocks.register.mockReset();
    authMocks.logout.mockReset();
  });

  it('shows a loading state until authentication bootstrap resolves', () => {
    const bootstrap = deferred<User | null>();

    authMocks.getCurrentUser.mockReturnValue(bootstrap.promise);

    renderWithProviders();

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading authentication',
    );
  });

  it('exposes an authenticated user after a successful bootstrap', async () => {
    authMocks.getCurrentUser.mockResolvedValue(authenticatedUser);

    renderWithProviders();

    expect(
      await screen.findByText('Authenticated as alex@example.com'),
    ).toBeInTheDocument();
  });

  it('exposes an unauthenticated state when bootstrap returns no user', async () => {
    authMocks.getCurrentUser.mockResolvedValue(null);

    renderWithProviders();

    expect(
      await screen.findByText('Unauthenticated'),
    ).toBeInTheDocument();
  });
});