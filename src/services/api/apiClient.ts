import { env } from '@/shared/constants/env';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.apiBaseUrl;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    console.log(`[API GET] ${this.baseUrl}${endpoint}`);
    throw new Error('API Client ready. Mock services currently handle frontend data.');
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    console.log(`[API POST] ${this.baseUrl}${endpoint}`, body);
    throw new Error('API Client ready. Mock services currently handle frontend data.');
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    console.log(`[API PUT] ${this.baseUrl}${endpoint}`, body);
    throw new Error('API Client ready. Mock services currently handle frontend data.');
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    console.log(`[API DELETE] ${this.baseUrl}${endpoint}`);
    throw new Error('API Client ready. Mock services currently handle frontend data.');
  }
}

export const apiClient = new ApiClient();
