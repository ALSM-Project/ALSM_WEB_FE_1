export const ROUTES = {
  PUBLIC: {
    LANDING: '/',
    REGISTER: '/register',
    LOGIN: '/login',
    FORGOT_PASSWORD: '/forgot-password',
  },
  ACCOUNT: {
    PASSWORD: '/account/security/password',
    TWO_FACTOR: '/account/security/2fa',
    SESSIONS: '/account/security/sessions',
  },
  PROJECTS: {
    NEW: '/projects/new',
    UPLOAD: (id = ':projectId') => `/projects/${id}/upload`,
    SCREENS: (id = ':projectId') => `/projects/${id}/screens`,
    CONVERT: (projectId = ':projectId', screenId = ':screenId') => `/projects/${projectId}/screens/${screenId}/convert`,
    BULK_CONVERT: (id = ':projectId') => `/projects/${id}/screens/bulk-convert`,
    RESULT: (projectId = ':projectId', screenId = ':screenId') => `/projects/${projectId}/screens/${screenId}/result`,
    PREVIEW: (projectId = ':projectId', screenId = ':screenId') => `/projects/${projectId}/screens/${screenId}/preview`,
    MAPPING: (projectId = ':projectId', screenId = ':screenId') => `/projects/${projectId}/screens/${screenId}/mapping`,
    EXPORT: (id = ':projectId') => `/projects/${id}/export`,
    DIAGNOSTICS: (id = ':projectId') => `/projects/${id}/diagnostics`,
  },
  BILLING: {
    PRICING: '/pricing',
    TRIAL: '/billing/trial',
    PAYMENT: '/billing/payment',
    UPGRADE: '/billing/upgrade',
    USAGE: '/usage',
    HISTORY: '/billing/history',
    SUBSCRIPTION: '/billing/subscription',
  },
};
