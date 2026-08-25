// Normalized API error matching the backend ApiExceptionFilter contract:
//   { statusCode, code, message, details, requestId }
// UI code should branch on `code` (e.g. INVALID_CREDENTIALS), not on the
// message string or on the raw fetch/axios shape.

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: unknown;
  public requestId?: string;

  constructor(message: string, status: number = 500, details?: unknown, code?: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}
