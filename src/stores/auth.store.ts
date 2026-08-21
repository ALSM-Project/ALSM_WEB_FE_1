import type { User } from '@/features/auth/types/auth';

export interface AuthStoreState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

export const initialAuthState: AuthStoreState = {
  user: null,
  isAuthenticated: false,
  token: null,
};
