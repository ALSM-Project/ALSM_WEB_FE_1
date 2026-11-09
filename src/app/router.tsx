import { createBrowserRouter, Navigate } from 'react-router-dom';

import AppLayout from '@/shared/layouts/AppLayout';
import PublicLayout from '@/shared/layouts/PublicLayout';
import AccountSettingsLayout from '@/shared/layouts/AccountSettingsLayout';
import { GuestRoute, ProtectedRoute, RoleGuard, PasswordCallbackPage, AuthCallbackPage } from './guards';

// Feature Modules
import { LandingPage, RegisterPage, LoginPage, PasswordRecoveryPage, FaqPage, ContactPage, ResetPasswordPage, VerifyEmailPage, ProspectInvitationPage } from '@/features/auth';
import { DocsPage, WorkspaceDocsPage } from '@/features/docs';

import {
  ProfileInfoPage,
  CompanyLegalProfilePage,
  CustomerContractsPage,
  PreferencesPage,
  ChangePasswordPage,
  TwoFactorAuthenticationPage,
  ActiveSessionsPage,
} from '@/features/account';
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
  VersionHistoryPage,
  PreviewStudioPage,
  FieldMappingPage,
  MethodMappingPage,
  ExportCodePage,
  ReviewFindingsPage,
  InitialQualityReviewPage,
} from '@/features/conversion';
import { WorkspaceContactPage } from '@/features/contact';
import { DiagnosticsPage } from '@/features/diagnostics';
import { Web1WorkspacePreview } from '@/features/preview/Web1WorkspacePreview';

import {
  RequestEnterprisePage,
  TrialActivationPage,
  UsageStatsPage,
  ContractDetailPage,
  ContractPreviewPage,
  InvoicesPage,
  InvoicePaymentCheckoutPage,
} from '@/features/billing';
import {
  OrganizationProfilePage,
  OrganizationMembersPage,
  OrganizationTeamsPage,
  OrganizationProjectsPage,
  OrganizationRolesPage,
  OrganizationAnalyticsPage,
  OrganizationAuditLogsPage,
} from '@/features/organization';


export const router = createBrowserRouter([
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/auth/password-callback', element: <PasswordCallbackPage /> },
  { path: '/prospect-invitation', element: <ProspectInvitationPage /> },
  // Public Routes (Header & Layout for all visitors)
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/faq', element: <FaqPage /> },
      { path: '/docs', element: <DocsPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/public/contracts/:contractId/sign', element: <ContractDetailPage /> },
      { path: '/public/contracts/:contractId', element: <ContractDetailPage /> },
      { path: '/public/billing/invoices/:invoiceId/pay', element: <InvoicePaymentCheckoutPage /> },
      { path: '/public/billing/contracts/:contractId/pay', element: <ContractDetailPage /> },
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
          { path: '/contracts', element: <CustomerContractsPage /> },
          { path: '/workspace-preview', element: <Web1WorkspacePreview /> },
          { path: '/workspace/docs', element: <WorkspaceDocsPage /> },

          { path: '/workspace/contact', element: <WorkspaceContactPage /> },
          { path: '/projects', element: <ProjectsListPage /> },
          { path: '/projects/:projectId', element: <ProjectOverviewPage /> },

          // Organization Profile & Enterprise Management Routes
          { path: '/settings/organization', element: <OrganizationProfilePage /> },
          { path: '/organization/profile', element: <OrganizationProfilePage /> },
          { path: '/settings/team', element: <OrganizationMembersPage /> },
          { path: '/settings/teams', element: <OrganizationTeamsPage /> },
          { path: '/settings/members', element: <OrganizationMembersPage /> },
          { path: '/organisation/members', element: <OrganizationMembersPage /> },
          { path: '/organization/members', element: <OrganizationMembersPage /> },
          { path: '/organisation/teams', element: <OrganizationTeamsPage /> },
          { path: '/organization/teams', element: <OrganizationTeamsPage /> },
          { path: '/internal-teams', element: <Navigate to="/organization/teams" replace /> },
          { path: '/organisation/projects', element: <OrganizationProjectsPage /> },
          { path: '/organization/projects', element: <OrganizationProjectsPage /> },
          { path: '/settings/roles', element: <OrganizationRolesPage /> },
          { path: '/organisation/roles', element: <OrganizationRolesPage /> },
          { path: '/organization/roles', element: <OrganizationRolesPage /> },
          { path: '/organisation/analytics', element: <OrganizationAnalyticsPage /> },
          { path: '/organization/analytics', element: <OrganizationAnalyticsPage /> },
          { path: '/organisation/audit-logs', element: <OrganizationAuditLogsPage /> },
          { path: '/organization/audit-logs', element: <OrganizationAuditLogsPage /> },

          // Account Security Nested Subroutes (Profile, Preferences, Passwords, etc.)
          {
            element: <AccountSettingsLayout />,
            children: [
              { path: '/account', element: <Navigate to="/account/profile" replace /> },
              { path: '/account/profile', element: <ProfileInfoPage /> },
              { path: '/account/company', element: <CompanyLegalProfilePage /> },
              { path: '/account/company-profile', element: <CompanyLegalProfilePage /> },
              { path: '/account/preferences', element: <PreferencesPage /> },
              { path: '/account/security', element: <Navigate to="/account/security/password" replace /> },
              { path: '/account/security/password', element: <ChangePasswordPage /> },
              { path: '/account/security/2fa', element: <TwoFactorAuthenticationPage /> },
              { path: '/account/security/sessions', element: <ActiveSessionsPage /> },
            ],
          },

          // Enterprise Contracts Management & Unified Contract Details / Signing / Payment View
          { path: '/account/contracts', element: <Navigate to="/contracts" replace /> },
          { path: '/account/contracts/:contractId', element: <ContractDetailPage /> },
          { path: '/account/contracts/:contractId/preview', element: <ContractPreviewPage /> },
          { path: '/account/contracts/:contractId/sign', element: <ContractDetailPage /> },
          { path: '/contracts', element: <CustomerContractsPage /> },
          { path: '/contracts/:contractId', element: <ContractDetailPage /> },
          { path: '/contracts/:contractId/preview', element: <ContractPreviewPage /> },
          { path: '/contracts/:contractId/sign', element: <ContractDetailPage /> },

          // Project & Conversion Pipeline Routes
          { path: '/projects/new', element: <CreateProjectPage /> },
          { path: '/projects/:projectId/upload', element: <UploadSourcePage /> },
          { path: '/projects/:projectId/screens', element: <ScreensListPage /> },
          { path: '/projects/:projectId/screens/:screenId/convert', element: <ConvertScreenPage /> },
          { path: '/projects/:projectId/screens/bulk-convert', element: <BulkConvertPage /> },
          { path: '/projects/:projectId/screens/:screenId/result', element: <ResultInspectionPage /> },
          // UC-31: Review Initial Conversion Quality — allowed for standard users (USER, MEMBER, ENGINEER, ADMIN, OWNER, etc.)
          {
            element: <RoleGuard allowedRoles={['USER', 'MEMBER', 'ENGINEER', 'ADMIN', 'OWNER', 'ENTERPRISE_CUSTOMER', 'ENTERPRISE_ADMIN']} />,
            children: [
              { path: '/projects/:projectId/screens/:screenId/quality-review', element: <InitialQualityReviewPage /> },
            ],
          },
          { path: '/projects/:projectId/screens/:screenId/history', element: <VersionHistoryPage /> },
          { path: '/projects/:projectId/screens/:screenId/preview', element: <PreviewStudioPage /> },
          { path: '/projects/:projectId/screens/:screenId/mapping', element: <FieldMappingPage /> },
          { path: '/projects/:projectId/screens/:screenId/method-mapping', element: <MethodMappingPage /> },
          { path: '/projects/:projectId/screens/:screenId/review', element: <ReviewFindingsPage /> },
          { path: '/projects/:projectId/export', element: <ExportCodePage /> },
          { path: '/projects/:projectId/diagnostics', element: <DiagnosticsPage /> },
          { path: '/projects/:projectId/delete', element: <DeleteProjectPage /> },

          // Billing & Enterprise Upgrade Routes (UC-32 & UC-35)
          { path: '/billing/usage', element: <UsageStatsPage /> },
          { path: '/billing/upgrade', element: <RequestEnterprisePage /> },
          { path: '/billing/trial', element: <TrialActivationPage /> },
          { path: '/billing/invoices', element: <InvoicesPage /> },
          { path: '/billing/invoices/:invoiceId', element: <InvoicesPage /> },
          { path: '/billing/invoices/:invoiceId/pay', element: <InvoicePaymentCheckoutPage /> },
          { path: '/billing/contracts/:contractId/pay', element: <ContractDetailPage /> },
        ],
      },
    ],
  },

  // Fallback Catch-all
  { path: '*', element: <Navigate to="/" replace /> },
]);
