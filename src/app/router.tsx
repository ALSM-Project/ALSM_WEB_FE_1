import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts from Shared Foundation
import PublicLayout from '@/shared/layouts/PublicLayout';
import AppLayout from '@/shared/layouts/AppLayout';
import AccountSettingsLayout from '@/shared/layouts/AccountSettingsLayout';

// Feature Modules
import { LandingPage, RegisterPage, LoginPage, PasswordRecoveryPage } from '@/features/auth';
import { ChangePasswordPage, TwoFactorAuthenticationPage, ActiveSessionsPage } from '@/features/account';
import { CreateProjectPage, DeleteProjectPage } from '@/features/projects';
import { UploadSourcePage, ScreensListPage } from '@/features/screens';
import {
  ConvertScreenPage,
  BulkConvertPage,
  ResultInspectionPage,
  PreviewStudioPage,
  FieldMappingPage,
  ExportCodePage,
} from '@/features/conversion';
import { DiagnosticsPage } from '@/features/diagnostics';
import {
  PricingPage,
  TrialActivationPage,
  QRPaymentPage,
  UpgradeSubscriptionPage,
  BillingHistoryPage,
  CancelSubscriptionPage,
} from '@/features/billing';
import { ResourceUsagePage } from '@/features/usage';

export const router = createBrowserRouter([
  // Public Routes
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <PasswordRecoveryPage /> },
    ],
  },

  // Authenticated App Routes (Web 1)
  {
    element: <AppLayout />,
    children: [
      // Account Security Nested Subroutes
      {
        element: <AccountSettingsLayout />,
        children: [
          { path: '/account/security/password', element: <ChangePasswordPage /> },
          { path: '/account/security/2fa', element: <TwoFactorAuthenticationPage /> },
          { path: '/account/security/sessions', element: <ActiveSessionsPage /> },
        ],
      },

      // Project & Conversion Routes
      { path: '/projects/new', element: <CreateProjectPage /> },
      { path: '/projects/:projectId/upload', element: <UploadSourcePage /> },
      { path: '/projects/:projectId/screens', element: <ScreensListPage /> },
      { path: '/projects/:projectId/screens/:screenId/convert', element: <ConvertScreenPage /> },
      { path: '/projects/:projectId/screens/bulk-convert', element: <BulkConvertPage /> },
      { path: '/projects/:projectId/screens/:screenId/result', element: <ResultInspectionPage /> },
      { path: '/projects/:projectId/screens/:screenId/preview', element: <PreviewStudioPage /> },
      { path: '/projects/:projectId/screens/:screenId/mapping', element: <FieldMappingPage /> },
      { path: '/projects/:projectId/export', element: <ExportCodePage /> },
      { path: '/projects/:projectId/diagnostics', element: <DiagnosticsPage /> },
      { path: '/projects/:projectId/delete', element: <DeleteProjectPage /> },

      // Billing Routes
      { path: '/pricing', element: <PricingPage /> },
      { path: '/billing/trial', element: <TrialActivationPage /> },
      { path: '/billing/payment', element: <QRPaymentPage /> },
      { path: '/billing/upgrade', element: <UpgradeSubscriptionPage /> },
      { path: '/usage', element: <ResourceUsagePage /> },
      { path: '/billing/history', element: <BillingHistoryPage /> },
      { path: '/billing/subscription', element: <CancelSubscriptionPage /> },
    ],
  },

  // Fallback Catch-all
  { path: '*', element: <Navigate to="/" replace /> },
]);
