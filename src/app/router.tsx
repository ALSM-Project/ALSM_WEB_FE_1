import { createBrowserRouter, Navigate } from 'react-router-dom';

import AppLayout from '@/shared/layouts/AppLayout';
import PublicLayout from '@/shared/layouts/PublicLayout';
import AccountSettingsLayout from '@/shared/layouts/AccountSettingsLayout';
import { GuestRoute, ProtectedRoute } from './guards';

// Feature Modules
import { LandingPage, RegisterPage, LoginPage, PasswordRecoveryPage, FaqPage, ContactPage, ResetPasswordPage, VerifyEmailPage } from '@/features/auth';
import { DocsPage, WorkspaceDocsPage } from '@/features/docs';

import { ChangePasswordPage, TwoFactorAuthenticationPage, ActiveSessionsPage } from '@/features/account';
import {
  ModernizationDashboardPage,
  ProjectsListPage,
  ProjectOverviewPage,
  CreateProjectPage,
  DeleteProjectPage,
} from '@/features/projects';
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
import { WorkspaceContactPage } from '@/features/contact';
import { DiagnosticsPage } from '@/features/diagnostics';
import { Web1WorkspacePreview } from '@/features/preview/Web1WorkspacePreview';

export const router = createBrowserRouter([
  // Public Routes (Header & Layout for all visitors)
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/faq', element: <FaqPage /> },
      { path: '/docs', element: <DocsPage /> },
      { path: '/contact', element: <ContactPage /> },
    ],
  },

  // Guest-only Routes (login / register / password recovery / email verification)
  {
    element: <GuestRoute />,
    children: [
      { path: '/register', element: <RegisterPage /> },
      { path: '/verify-email', element: <VerifyEmailPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <PasswordRecoveryPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },

  // Authenticated App Routes (Web 1 PoC Workspace)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // PoC Workspace Main Entry Points
          { path: '/dashboard', element: <ModernizationDashboardPage /> },
          { path: '/workspace-preview', element: <Web1WorkspacePreview /> },
          { path: '/workspace/docs', element: <WorkspaceDocsPage /> },

          { path: '/workspace/contact', element: <WorkspaceContactPage /> },
          { path: '/projects', element: <ProjectsListPage /> },
          { path: '/projects/:projectId', element: <ProjectOverviewPage /> },

          // Account Security Nested Subroutes
          {
            element: <AccountSettingsLayout />,
            children: [
              { path: '/account/security/password', element: <ChangePasswordPage /> },
              { path: '/account/security/2fa', element: <TwoFactorAuthenticationPage /> },
              { path: '/account/security/sessions', element: <ActiveSessionsPage /> },
            ],
          },

          // Project & Conversion Pipeline Routes
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
        ],
      },
    ],
  },

  // Fallback Catch-all
  { path: '*', element: <Navigate to="/" replace /> },
]);
