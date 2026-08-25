export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  isDev: import.meta.env.DEV,
};
