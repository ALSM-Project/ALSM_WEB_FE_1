export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  apiTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS || 30000),
  isDev: import.meta.env.DEV,
};
