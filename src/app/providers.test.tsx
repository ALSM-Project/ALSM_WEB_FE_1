import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authService } from '@/features/auth/services/auth.service';
import type { User } from '@/features/auth/types/auth';
import { AppProviders, useAuth } from './providers';

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

const currentUser = vi.mocked(authService.getCurrentUser);

function AuthStatus() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <p role="status">Loading authentication</p>;
  }

  return <p>{isAuthenticated ? `Authenticated as ${user?.email}` : 'Unauthenticated'}</p>;
}

function renderWithProviders() {
  return render(
    <AppProviders>
      <AuthStatus />
    </AppProviders>,
  );
}

function deferred<T>() {
  let resolve: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve: resolve! };
}

const authenticatedUser: User = {
  id: 'user-1',
  fullName: 'Alex Vance',
  email: 'alex@example.com',
  role: 'USER',
};

describe('AppProviders authentication bootstrap', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state until authentication bootstrap resolves', () => {
    const bootstrap = deferred<User | null>();
    currentUser.mockReturnValueOnce(bootstrap.promise);

    renderWithProviders();

    expect(screen.getByRole('status')).toHaveTextContent('Loading authentication');
  });

  it('exposes an authenticated user after a successful bootstrap', async () => {
    currentUser.mockResolvedValueOnce(authenticatedUser);

    renderWithProviders();

    expect(await screen.findByText('Authenticated as alex@example.com')).toBeInTheDocument();
  });

  it('exposes an unauthenticated state when bootstrap returns no user', async () => {
    currentUser.mockResolvedValueOnce(null);

    renderWithProviders();

    expect(await screen.findByText('Unauthenticated')).toBeInTheDocument();
  });
});
