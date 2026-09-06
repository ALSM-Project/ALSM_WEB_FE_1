// Token storage policy (per FE guideline 03 §7):
// - Access token lives in memory only (cleared on reload).
// - Refresh token is persisted in localStorage so a reload can re-establish
//   the session by calling /auth/refresh, then /auth/me.
//
// Never persist password or OTP.

const REFRESH_TOKEN_KEY = 'alsm.refresh.token';

let accessToken: string | null = null;

function safeGet(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function safeSet(value: string | null): void {
  try {
    if (value) {
      localStorage.setItem(REFRESH_TOKEN_KEY, value);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {
    // Storage unavailable (private mode / blocked) — degrade to memory-only.
  }
}

export const tokenStore = {
  getAccessToken(): string | null {
    return accessToken;
  },

  setAccessToken(token: string | null): void {
    accessToken = token;
  },

  getRefreshToken(): string | null {
    return safeGet();
  },

  setRefreshToken(token: string | null): void {
    safeSet(token);
  },

  clear(): void {
    accessToken = null;
    safeSet(null);
  },
};
