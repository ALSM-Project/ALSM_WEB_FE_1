import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosProgressEvent, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/shared/constants/env';
import { ApiError } from './apiError';
import { tokenStore, type AuthTokens } from './tokenStore';

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
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  /** Set 'blob' when the response body is binary (e.g. a downloaded zip), not JSON. */
  responseType?: 'json' | 'blob';
}

const REFRESH_ENDPOINT = '/auth/refresh';

// Axios copies custom config fields through the pipeline, so we stash the
// skip-auth flag here and read it back in the interceptors. Named `_skipAuth`
// (not `auth`) because axios reserves `auth` for HTTP Basic credentials.
interface AuthedRequestConfig extends InternalAxiosRequestConfig {
  _skipAuth?: boolean;
  _retry?: boolean;
  _authEpoch?: string;
  _accessToken?: string | null;
}

export class ApiClient {
  private readonly axios: AxiosInstance;
  private readonly baseUrl: string;
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
        cfg._authEpoch = tokenStore.epoch();
        cfg._accessToken = tokenStore.getAccessToken();
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
          error.response?.status === 401 && !cfg?._skipAuth && !cfg?._retry && !isRefreshEndpoint && !tokenStore.requiresPasswordChange() &&
          !['/auth/change-password', '/auth/set-password'].includes(cfg?.url || '');

        if (canRetry && cfg) {
          if (cfg._authEpoch !== tokenStore.epoch()) return Promise.reject(this.toApiError(error));
          cfg._retry = true;
          let newToken: string | null;
          try {
            const current = tokenStore.getAccessToken();
            newToken = current && current !== cfg._accessToken ? current : (await this.refreshSession())?.accessToken || null;
          } catch (refreshError) {
            if (!tokenStore.getRefreshToken() && !tokenStore.isLogoutPending() && cfg._authEpoch !== tokenStore.epoch()) this.authFailureHandler?.();
            return Promise.reject(refreshError);
          }
          if (cfg._authEpoch !== tokenStore.epoch()) return Promise.reject(this.toApiError(error));
          if (newToken && !tokenStore.requiresPasswordChange()) {
            cfg.headers.Authorization = `Bearer ${newToken}`;
            return this.axios(cfg);
          }
          if (!tokenStore.isLogoutPending() && !tokenStore.requiresPasswordChange()) this.authFailureHandler?.();
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

  /** POSTs a multipart/form-data body (e.g. file uploads). Axios sets the boundary automatically. */
  async postForm<T>(
    endpoint: string,
    form: FormData,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: form });
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
      onUploadProgress: options.onUploadProgress,
      responseType: options.responseType,
      _skipAuth: options.auth === false,
    };

    const response = await this.axios.request<T>(config);
    return response.data;
  }

  /** Shared by restoration and interceptors, including StrictMode remounts. */
  public refreshSession(): Promise<AuthTokens | null> {
    return tokenStore.refresh(async (refreshToken) => {
      const response = await axios.post<AuthTokens>(`${this.baseUrl}${REFRESH_ENDPOINT}`, { refreshToken }, { timeout: 30000 });
      return response.data;
    });
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
