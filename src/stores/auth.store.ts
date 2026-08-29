import type { User } from '@/features/auth/types/auth';

// Session state shape. The access token itself lives in memory via tokenStore;
// this store reflects the derived UI state (user + auth flags) only.
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
