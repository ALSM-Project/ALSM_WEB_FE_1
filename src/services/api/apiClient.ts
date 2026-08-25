import { env } from '@/shared/constants/env';
import { ApiError } from './apiError';
import { tokenStore } from './tokenStore';

// Shared API client (FE guideline 04 §2). Single place that owns:
// - base URL + /api/v1 prefix (from env, not duplicated in services);
// - Authorization header from the in-memory access token;
// - 401 → single-flight refresh → retry (avoids refresh storm);
// - error normalization to ApiError.
//
// Components must never call fetch/axios directly.

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Send Authorization header. Defaults to true; set false for login/register/refresh. */
  auth?: boolean;
  headers?: Record<string, string>;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const REFRESH_ENDPOINT = '/auth/refresh';

export class ApiClient {
  private readonly baseUrl: string;
  private refreshPromise: Promise<string | null> | null = null;
  private authFailureHandler: (() => void) | null = null;

  constructor() {
    this.baseUrl = `${env.apiBaseUrl.replace(/\/+$/, '')}/api/v1`;
  }

  /** Called by the auth provider so a failed refresh clears the session state. */
  setAuthFailureHandler(handler: (() => void) | null): void {
    this.authFailureHandler = handler;
  }

  async get<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async delete<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.doRequest<T>(endpoint, options, false);
  }

  private async doRequest<T>(endpoint: string, options: RequestOptions, hasRetried: boolean): Promise<T> {
    const method = options.method ?? 'GET';
    const auth = options.auth ?? true;
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...options.headers };

    if (auth) {
      const token = tokenStore.getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    // Refresh flow: only for authenticated requests, once, and never for the
    // refresh endpoint itself (which would loop).
    if (response.status === 401 && auth && !hasRetried && endpoint !== REFRESH_ENDPOINT) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        return this.doRequest<T>(endpoint, options, true);
      }
      this.authFailureHandler?.();
      throw await this.toApiError(response);
    }

    if (!response.ok) {
      throw await this.toApiError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  /** Single-flight refresh: concurrent 401s share one refresh request. */
  private refreshAccessToken(): Promise<string | null> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.doRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async doRefresh(): Promise<string | null> {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) {
      tokenStore.clear();
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}${REFRESH_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        tokenStore.clear();
        return null;
      }

      const tokens = (await response.json()) as TokenPair;
      tokenStore.setAccessToken(tokens.accessToken);
      tokenStore.setRefreshToken(tokens.refreshToken);
      return tokens.accessToken;
    } catch {
      tokenStore.clear();
      return null;
    }
  }

  private async toApiError(response: Response): Promise<ApiError> {
    let payload: {
      message?: string;
      code?: string;
      details?: unknown;
      requestId?: string;
    } | null = null;

    try {
      payload = (await response.json()) as {
        message?: string;
        code?: string;
        details?: unknown;
        requestId?: string;
      };
    } catch {
      payload = null;
    }

    return new ApiError(
      payload?.message || response.statusText || 'Request failed',
      response.status,
      payload?.details,
      payload?.code,
      payload?.requestId,
    );
  }
}

export const apiClient = new ApiClient();
