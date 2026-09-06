import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/shared/constants/env';
import { ApiError } from './apiError';
import { tokenStore } from './tokenStore';

// Shared API client (FE guideline 04 §2-5). Single place that owns:
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

// Axios copies custom config fields through the pipeline, so we stash the
// skip-auth flag here and read it back in the interceptors. Named `_skipAuth`
// (not `auth`) because axios reserves `auth` for HTTP Basic credentials.
interface AuthedRequestConfig extends InternalAxiosRequestConfig {
  _skipAuth?: boolean;
  _retry?: boolean;
}

export class ApiClient {
  private readonly axios: AxiosInstance;
  private readonly baseUrl: string;
  private refreshPromise: Promise<string | null> | null = null;
  private authFailureHandler: (() => void) | null = null;

  constructor() {
    this.baseUrl = `${env.apiBaseUrl.replace(/\/+$/, '')}/api/v1`;
    this.axios = axios.create({
      baseURL: this.baseUrl,
      timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 30000),
    });

    // Attach the Authorization header from the in-memory access token.
    this.axios.interceptors.request.use((config) => {
      const cfg = config as AuthedRequestConfig;
      if (!cfg._skipAuth) {
        const token = tokenStore.getAccessToken();
        if (token) {
          cfg.headers.Authorization = `Bearer ${token}`;
        }
      }
      return cfg;
    });

    // 401 → single-flight refresh → retry once.
    this.axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const cfg = error.config as AuthedRequestConfig | undefined;
        const isRefreshEndpoint = cfg?.url === REFRESH_ENDPOINT;
        const canRetry =
          error.response?.status === 401 && !cfg?._skipAuth && !cfg?._retry && !isRefreshEndpoint;

        if (canRetry && cfg) {
          cfg._retry = true;
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            cfg.headers.Authorization = `Bearer ${newToken}`;
            return this.axios(cfg);
          }
          this.authFailureHandler?.();
        }

        return Promise.reject(this.toApiError(error));
      },
    );
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

  async patch<T>(endpoint: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const config: AxiosRequestConfig & { _skipAuth?: boolean } = {
      method: options.method ?? 'GET',
      url: endpoint,
      data: options.body,
      headers: options.headers,
      _skipAuth: options.auth === false,
    };

    const response = await this.axios.request<T>(config);
    return response.data;
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
      const response = await axios.post<TokenPair>(
        `${this.baseUrl}${REFRESH_ENDPOINT}`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      );

      tokenStore.setAccessToken(response.data.accessToken);
      tokenStore.setRefreshToken(response.data.refreshToken);
      return response.data.accessToken;
    } catch {
      tokenStore.clear();
      return null;
    }
  }

  private toApiError(error: AxiosError): ApiError {
    const payload = error.response?.data as
      | { message?: string; code?: string; details?: unknown; requestId?: string }
      | undefined;

    const status = error.response?.status ?? 500;
    return new ApiError(
      payload?.message || error.message || 'Request failed',
      status,
      payload?.details,
      payload?.code,
      payload?.requestId,
    );
  }
}

export const apiClient = new ApiClient();
