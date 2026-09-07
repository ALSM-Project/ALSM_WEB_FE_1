import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts from Shared Foundation
import PublicLayout from '@/shared/layouts/PublicLayout';
import AppLayout from '@/shared/layouts/AppLayout';
import AccountSettingsLayout from '@/shared/layouts/AccountSettingsLayout';
import { GuestRoute, ProtectedRoute } from './guards';

// Feature Modules
import { LandingPage, RegisterPage, LoginPage, PasswordRecoveryPage, FaqPage, ContactPage, ResetPasswordPage } from '@/features/auth';
import { DocsPage } from '@/features/docs';
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
  ReviewFindingsPage,
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
  // Public Routes (Header & Layout for all visitors)
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/pricing', element: <PricingPage /> },
      { path: '/faq', element: <FaqPage /> },
      { path: '/docs', element: <DocsPage /> },
      { path: '/contact', element: <ContactPage /> },
    ],
  },

  // Guest-only Routes (login / register / password recovery)
  {
    element: <GuestRoute />,
    children: [
      { path: '/register', element: <RegisterPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <PasswordRecoveryPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },

  // Authenticated App Routes (Web 1)
  {
    element: <ProtectedRoute />,
    children: [
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
          { path: '/projects/:projectId/screens/:screenId/review', element: <ReviewFindingsPage /> },
          { path: '/projects/:projectId/export', element: <ExportCodePage /> },
          { path: '/projects/:projectId/diagnostics', element: <DiagnosticsPage /> },
          { path: '/projects/:projectId/delete', element: <DeleteProjectPage /> },

          // Billing Routes
          { path: '/billing/trial', element: <TrialActivationPage /> },
          { path: '/billing/payment', element: <QRPaymentPage /> },
          { path: '/billing/upgrade', element: <UpgradeSubscriptionPage /> },
          { path: '/usage', element: <ResourceUsagePage /> },
          { path: '/billing/history', element: <BillingHistoryPage /> },
          { path: '/billing/subscription', element: <CancelSubscriptionPage /> },
        ],
      },
    ],
  },

  // Fallback Catch-all
  { path: '*', element: <Navigate to="/" replace /> },
]);
