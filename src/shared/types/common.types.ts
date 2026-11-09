export interface PaginationParams { page: number; limit: number; search?: string; }
export interface ApiResponse<T> { success: boolean; data: T; message?: string; }