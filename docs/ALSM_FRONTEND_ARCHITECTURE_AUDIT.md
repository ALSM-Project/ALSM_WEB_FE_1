# ALSM Frontend Architecture Audit

Audit Date: 2026-08-21  
Scope: **Web 1 — Self-Service Frontend (`ALSM_WEB_FE`)**  
Guideline Source of Truth: [`docs/01_architecture_ALSM.md`](file:///e:/ALSM/ALSM_WEB_FE/docs/01_architecture_ALSM.md)  
Git Repository Status: Workspace directory `E:\ALSM\ALSM_WEB_FE` is not initialized as a git repository (Direct File System Audit).

---

## 1. Executive Summary

### Overall Status
**PASS WITH WARNINGS**

The frontend codebase of `ALSM_WEB_FE` has successfully completed its core structural migration to a **Feature-First Domain-Driven Architecture** aligned with `docs/01_architecture_ALSM.md`. All 8 domain features (`auth`, `account`, `projects`, `screens`, `conversion`, `diagnostics`, `billing`, `usage`) are encapsulated under `src/features/` with colocated pages, components, services, and types. `npm run build` and `npm run lint` execute with **0 compilation errors and 0 lint errors**.

However, several architectural gaps exist regarding server state management, route protection, Zustand store activation, and backend API integration readiness.

### Architecture Scores (Scale: 1-10)

- **Architecture Structure**: `9/10` (Strict feature separation, shared UI primitives, clean barrel exports).
- **Feature Boundaries**: `9/10` (Features own domain components and pages; no cross-feature private leakages).
- **State Management**: `4/10` (TanStack Query setup but unadopted; Zustand stores stubbed without `create()` instantiation).
- **API Layer**: `5/10` (Clean `apiClient.ts` abstraction, but `client.ts` duplicate exists, no authorization header interceptors or token refresh logic).
- **Routing / Auth**: `6/10` (Comprehensive React Router 7 setup, but lacks explicit `ProtectedRoute` / `GuestRoute` navigation guards).
- **Type Safety**: `9/10` (Strong TypeScript typings, zero `any` or dangerous type assertions).
- **Maintainability**: `8.5/10` (Clear `@/*` path alias resolution, zero circular dependencies, isolated mock data).

### Top 3 Architectural Risks
1. **Unadopted Server State Management (TanStack Query)**: `QueryClientProvider` is initialized, but all feature pages use manual `useEffect` + `setState` + `service.get...()` calls, missing caching, deduplication, automatic refetching, and job polling.
2. **Missing Auth Navigation Guards**: `AppLayout` renders authenticated views without verifying `user` or `isAuthenticated` state, allowing unauthenticated deep linking.
3. **Zustand Client State Inactive**: `src/stores/` defines TypeScript interfaces and initial objects but does not invoke Zustand's `create()` function or expose store hooks.

---

## 2. Current Source Tree

```text
ALSM_WEB_FE/src/
├── app/
│   ├── App.tsx
│   ├── providers.tsx
│   ├── queryClient.ts
│   └── router.tsx
├── features/
│   ├── account/
│   │   ├── pages/
│   │   │   ├── ActiveSessionsPage.tsx
│   │   │   ├── ChangePasswordPage.tsx
│   │   │   └── TwoFactorAuthenticationPage.tsx
│   │   ├── services/
│   │   │   └── account.service.ts
│   │   ├── types/
│   │   │   └── account.ts
│   │   └── index.ts
│   ├── auth/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── PasswordRecoveryPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── types/
│   │   │   └── auth.ts
│   │   └── index.ts
│   ├── billing/
│   │   ├── pages/
│   │   │   ├── BillingHistoryPage.tsx
│   │   │   ├── CancelSubscriptionPage.tsx
│   │   │   ├── PricingPage.tsx
│   │   │   ├── QRPaymentPage.tsx
│   │   │   ├── TrialActivationPage.tsx
│   │   │   └── UpgradeSubscriptionPage.tsx
│   │   ├── services/
│   │   │   └── billing.service.ts
│   │   ├── types/
│   │   │   └── billing.ts
│   │   └── index.ts
│   ├── conversion/
│   │   ├── components/
│   │   │   ├── ASTTree.tsx
│   │   │   ├── CodeViewer.tsx
│   │   │   └── DeviceSwitcher.tsx
│   │   ├── pages/
│   │   │   ├── BulkConvertPage.tsx
│   │   │   ├── ConvertScreenPage.tsx
│   │   │   ├── ExportCodePage.tsx
│   │   │   ├── FieldMappingPage.tsx
│   │   │   ├── PreviewStudioPage.tsx
│   │   │   └── ResultInspectionPage.tsx
│   │   ├── services/
│   │   │   └── conversion.service.ts
│   │   ├── types/
│   │   │   └── conversion.ts
│   │   └── index.ts
│   ├── diagnostics/
│   │   ├── pages/
│   │   │   └── DiagnosticsPage.tsx
│   │   ├── services/
│   │   │   └── diagnostics.service.ts
│   │   ├── types/
│   │   │   └── diagnostics.ts
│   │   └── index.ts
│   ├── projects/
│   │   ├── pages/
│   │   │   ├── CreateProjectPage.tsx
│   │   │   └── DeleteProjectPage.tsx
│   │   ├── services/
│   │   │   └── project.service.ts
│   │   ├── types/
│   │   │   └── project.ts
│   │   └── index.ts
│   ├── screens/
│   │   ├── pages/
│   │   │   ├── ScreensListPage.tsx
│   │   │   └── UploadSourcePage.tsx
│   │   ├── services/
│   │   │   └── screen.service.ts
│   │   ├── types/
│   │   │   └── screen.ts
│   │   └── index.ts
│   └── usage/
│       ├── pages/
│       │   └── ResourceUsagePage.tsx
│       ├── services/
│       │   └── usage.service.ts
│       └── index.ts
├── shared/
│   ├── constants/
│   │   ├── brand.ts
│   │   ├── env.ts
│   │   └── routes.ts
│   ├── layouts/
│   │   ├── AccountSettingsLayout.tsx
│   │   ├── AppLayout.tsx
│   │   └── PublicLayout.tsx
│   ├── navigation/
│   │   └── Breadcrumb.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── ProgressBar.tsx
│       └── Tabs.tsx
├── services/
│   └── api/
│       ├── apiClient.ts
│       ├── apiError.ts
│       └── client.ts (Duplicate)
├── stores/
│   ├── auth.store.ts
│   ├── organization.store.ts
│   └── ui.store.ts
├── mocks/
│   ├── auth.mock.ts
│   ├── billing.mock.ts
│   ├── conversions.mock.ts
│   ├── diagnostics.mock.ts
│   ├── projects.mock.ts
│   ├── screens.mock.ts
│   └── sessions.mock.ts
├── styles/
│   └── globals.css
└── main.tsx
```

---

## 3. Architecture Guideline Compliance

| Guideline Requirement | Compliance Status | Details / Evidence |
|---|---|---|
| Tech Stack (React + Vite + TS + Tailwind) | **PASS** | React 19, Vite 8, TypeScript 5.8, Tailwind CSS v3. |
| Feature-First Folder Organization | **PASS** | All 8 domain features placed inside `src/features/` with isolated boundaries. |
| Application Layer Composition (`src/app/`) | **PASS** | `src/app/` strictly handles router, provider wrapping, and query client instantiation. |
| Shared UI Primitives Isolation | **PASS** | `src/shared/ui/` contains generic primitives (`Button`, `Input`, `Modal`, `Badge`, `Tabs`, `ProgressBar`). |
| API Infrastructure Layer | **PASS** | `src/services/api/apiClient.ts` abstracts base HTTP requests. |
| Cross-Feature Store Isolation | **WARNING** | Store interfaces exist in `src/stores/`, but stores are not instantiated using `create()`. |
| Path Alias Configuration (`@/*`) | **PASS** | Configured in `tsconfig.app.json` and `vite.config.ts`. |
| Mock Layer Abstraction | **PASS** | Isolated under `src/mocks/` and consumed via service abstractions. |

---

## 4. Feature Boundary Audit

### FEATURE: `auth`
- **Status**: **PASS**
- **Findings**: Pages (`LandingPage`, `LoginPage`, `RegisterPage`, `PasswordRecoveryPage`), services (`auth.service.ts`), and types (`auth.ts`) are completely colocated. Public barrel `src/features/auth/index.ts` cleanly exports public components and services.
- **Evidence**: `src/features/auth/index.ts`

### FEATURE: `account`
- **Status**: **PASS**
- **Findings**: Pages (`ChangePasswordPage`, `TwoFactorAuthenticationPage`, `ActiveSessionsPage`), services, and types are domain-scoped.
- **Evidence**: `src/features/account/index.ts`

### FEATURE: `projects`
- **Status**: **PASS**
- **Findings**: Pages (`CreateProjectPage`, `DeleteProjectPage`), services (`project.service.ts`), and types (`project.ts`) are self-contained.
- **Evidence**: `src/features/projects/index.ts`

### FEATURE: `screens`
- **Status**: **PASS**
- **Findings**: Pages (`ScreensListPage`, `UploadSourcePage`), services (`screen.service.ts`), and types (`screen.ts`) are properly colocated.
- **Evidence**: `src/features/screens/index.ts`

### FEATURE: `conversion`
- **Status**: **PASS**
- **Findings**: Conversion-specific domain components (`ASTTree`, `CodeViewer`, `DeviceSwitcher`) are correctly placed inside `src/features/conversion/components/` instead of leaking into `shared/`.
- **Evidence**: `src/features/conversion/components/ASTTree.tsx`, `CodeViewer.tsx`

### FEATURE: `diagnostics`
- **Status**: **PASS**
- **Findings**: `DiagnosticsPage.tsx`, `diagnostics.service.ts`, and `diagnostics.ts` are colocated under `src/features/diagnostics/`.
- **Evidence**: `src/features/diagnostics/index.ts`

### FEATURE: `billing`
- **Status**: **PASS**
- **Findings**: All 6 billing/subscription pages (`PricingPage`, `TrialActivationPage`, `QRPaymentPage`, `UpgradeSubscriptionPage`, `BillingHistoryPage`, `CancelSubscriptionPage`), `billing.service.ts`, and `billing.ts` are colocated.
- **Evidence**: `src/features/billing/index.ts`

### FEATURE: `usage`
- **Status**: **PASS**
- **Findings**: `ResourceUsagePage.tsx` and `usage.service.ts` are properly isolated.
- **Evidence**: `src/features/usage/index.ts`

---

## 5. App Layer Audit

Audit Path: `src/app/`
- **`App.tsx`**: Clean root component wrapping `AppProviders` and `RouterProvider`.
- **`router.tsx`**: Defines all public and authenticated routes importing directly from `@/features/*` and `@/shared/layouts/*`.
- **`providers.tsx`**: Provides `AuthContext` and wraps children with `QueryClientProvider`.
- **`queryClient.ts`**: Instantiates `new QueryClient()`.

**Violations / Issues**:
- No business logic, large page UI, or hardcoded mock data found in `src/app/`.
- **Minor Finding**: `src/app/providers.tsx` defines a custom `AuthContext` using local `useState` rather than utilizing the `auth.store.ts` Zustand store or a dedicated auth hook.

---

## 6. Shared Layer Audit

Audit Path: `src/shared/`
- **`src/shared/ui/`**: Generic UI components (`Badge`, `Button`, `Input`, `Modal`, `ProgressBar`, `Tabs`).
- **`src/shared/navigation/`**: Generic `Breadcrumb.tsx`.
- **`src/shared/layouts/`**: `PublicLayout.tsx`, `AppLayout.tsx`, `AccountSettingsLayout.tsx`.
- **`src/shared/constants/`**: `brand.ts`, `env.ts`, `routes.ts`.

**Feature Leakage Check**:
- `shared/` contains **ZERO** imports from `src/features/`.
- Domain-specific components like `ASTTree` and `CodeViewer` are strictly kept within `src/features/conversion/components/`.

---

## 7. API / Service Audit

### Service Layer Design
- Component → Service → Mock / API Client architecture is maintained across all features.
- Components do **NOT** invoke Axios or `fetch` directly.

### Issues
- **`src/services/api/client.ts`**: Duplicate file alongside `src/services/api/apiClient.ts`. `client.ts` uses relative imports (`../../config/env`) while `apiClient.ts` uses path alias (`@/shared/constants/env`).
- **API Error Handling**: `apiError.ts` is defined, but no request/response interceptors are configured in `apiClient.ts` to normalize HTTP status codes (e.g. 401, 403, 500).

---

## 8. TanStack Query Audit

**Status**: **NOT ACTUALLY ADOPTED**

### Findings
1. `QueryClientProvider` is configured in `src/app/providers.tsx` and `src/app/queryClient.ts`.
2. **Zero** pages or feature components use `useQuery` or `useMutation`.
3. All feature pages (e.g., `ScreensListPage.tsx`, `DiagnosticsPage.tsx`, `BillingHistoryPage.tsx`, `ResourceUsagePage.tsx`) fetch data using manual `useEffect` + local `useState`:
   ```tsx
   // ScreensListPage.tsx (L17-L20)
   useEffect(() => {
     screenService.getScreens(projectId).then((data) => setScreens(data));
   }, [projectId]);
   ```
4. Conversion job execution in `ConvertScreenPage.tsx` and `BulkConvertPage.tsx` does not utilize polling queries or mutation hooks.

---

## 9. Zustand Audit

**Status**: **SERVER STATE & CLIENT STATE GAP**

### Findings
1. Files `auth.store.ts`, `organization.store.ts`, and `ui.store.ts` exist in `src/stores/`.
2. None of these files call Zustand's `create()` function. They only define TypeScript interfaces and plain JavaScript objects:
   ```ts
   // auth.store.ts
   export interface AuthStoreState { ... }
   export const initialAuthState: AuthStoreState = { ... };
   ```
3. Store hooks (e.g. `useAuthStore`, `useOrganizationStore`, `useUIStore`) are neither instantiated nor exported.
4. No sensitive tokens or server entity lists are improperly persisted in `localStorage`.

---

## 10. Auth / Guards Audit

### Findings
1. **Mock Authentication**: `authService` in `src/features/auth/services/auth.service.ts` uses simulated local promises and mock user data (`mockUser`).
2. **Missing Navigation Guards**: `src/app/router.tsx` renders `<AppLayout />` for all authenticated application routes (`/projects/*`, `/billing/*`, `/usage`, `/account/*`). However, `<AppLayout />` does not enforce an authentication check:
   - There is no `ProtectedRoute` component verifying `isAuthenticated` or `user`.
   - An unauthenticated user can directly navigate to `/projects/proj-acme/screens` or `/billing/subscription` via URL.

---

## 11. Organization Context Audit

### Findings
1. `src/stores/organization.store.ts` defines a static mock organization ID (`org-acme-corp`).
2. API requests in `src/services/api/apiClient.ts` do not append an `X-Organization-Id` header to outgoing requests.
3. Feature service methods accept `projectId` or `screenId` as parameters, but do not scope requests by `organizationId`.

---

## 12. Routing Audit

### Route Definitions (`src/app/router.tsx`)
- All 21 Web 1 routes defined in `docs/01_architecture_ALSM.md` are correctly mapped:
  - Public: `/`, `/register`, `/login`, `/forgot-password`
  - Account Security: `/account/security/password`, `/account/security/2fa`, `/account/security/sessions`
  - Projects & Screens: `/projects/new`, `/projects/:projectId/upload`, `/projects/:projectId/screens`, `/projects/:projectId/screens/bulk-convert`, `/projects/:projectId/screens/:screenId/convert`, `/projects/:projectId/screens/:screenId/result`, `/projects/:projectId/screens/:screenId/preview`, `/projects/:projectId/screens/:screenId/mapping`, `/projects/:projectId/export`, `/projects/:projectId/diagnostics`, `/projects/:projectId/delete`
  - Billing & Usage: `/pricing`, `/billing/trial`, `/billing/payment`, `/billing/upgrade`, `/usage`, `/billing/history`, `/billing/subscription`

### Findings
- Zero duplicate or dead routes.
- Fallback route (`*`) correctly redirects to `/`.

---

## 13. Import Boundary Audit

### Relative Import Inspection
- All cross-layer imports use `@/*` alias (`@/features/*`, `@/shared/*`, `@/app/*`, `@/services/*`, `@/stores/*`, `@/mocks/*`).
- Relative imports (`../`) inside `src/features/` are strictly limited to 1 level deep internal colocations (`../services/`, `../types/`, `../components/`).
- Zero deep relative imports (`../../../`) exist across features.

### Barrel Export Bypass Finding
- Some files import internal feature subfolders instead of the feature's `index.ts` public barrel.
  - Example: `src/app/providers.tsx` imports `@/features/auth/services/auth.service` and `@/features/auth/types/auth` instead of `@/features/auth`.

---

## 14. Circular Dependency Audit

- Checked import graph across `src/app/`, `src/features/`, `src/shared/`, and `src/services/`.
- **Result**: **NO CONFIRMED CYCLES**.
- Feature barrel exports (`index.ts`) do not re-export circular dependencies back to shared layers.

---

## 15. Type Ownership Audit

### Findings
- Domain types are correctly colocated within their respective feature modules:
  - `src/features/auth/types/auth.ts`
  - `src/features/account/types/account.ts`
  - `src/features/projects/types/project.ts`
  - `src/features/screens/types/screen.ts`
  - `src/features/conversion/types/conversion.ts`
  - `src/features/diagnostics/types/diagnostics.ts`
  - `src/features/billing/types/billing.ts`
- **Zero usage of `any`** or `as unknown as` type coercions found in source code.

---

## 16. Mock Data Audit

- All mock data is centralized under `src/mocks/`:
  - `auth.mock.ts`, `billing.mock.ts`, `conversions.mock.ts`, `diagnostics.mock.ts`, `projects.mock.ts`, `screens.mock.ts`, `sessions.mock.ts`.
- Feature pages do not import mock data directly; they consume mock data indirectly through feature services (`screenService`, `projectService`, `conversionService`, `billingService`, `diagnosticsService`).
- **Classification**: **GOOD MOCK ABSTRACTION**.

---

## 17. Visual Regression Audit

- **Global Styles**: Global CSS is isolated in `src/styles/globals.css` and imported in `src/main.tsx`.
- **Tailwind Config**: Utility classes and brand colors (`brand-50` to `brand-700`) are consistently used.
- **Production Build Artifacts**: `npm run build` generates optimized CSS (`32.35 kB`) and JS (`504.43 kB`) without styling errors.

---

## 18. Functional Regression Audit

- Verified code path connections:
  - Screens List (`/projects/:projectId/screens`) → Conversion Studio (`/projects/:projectId/screens/:screenId/convert`).
  - Conversion Studio → Result Inspection (`/projects/:projectId/screens/:screenId/result`).
  - Result Inspection → Preview Studio (`/projects/:projectId/screens/:screenId/preview`).
  - Result Inspection → Field Mapping (`/projects/:projectId/screens/:screenId/mapping`).
  - Result Inspection → Export Code (`/projects/:projectId/export`).
- Routes and event handlers operate predictably with mock delays.

---

## 19. Dead / Duplicate Code Audit

1. **`src/services/api/client.ts`**: Obsolete duplicate of `src/services/api/apiClient.ts`.
2. **`src/config/` Re-exports**: `src/config/brand.ts`, `env.ts`, `routes.ts` serve as legacy wrappers re-exporting from `@/shared/constants/*`.

---

## 20. Configuration Audit

### `package.json`
- **Status**: **VALID**
- React 19, Vite 8, TypeScript 5.8, Tailwind CSS v3. `npm run build` and `npm run lint` scripts defined.

### `tsconfig.app.json`
- **Status**: **VALID**
- `"moduleResolution": "bundler"`, `"noEmit": true`, `"jsx": "react-jsx"`, `"paths": { "@/*": ["./src/*"] }`.

### `vite.config.ts`
- **Status**: **VALID**
- `@/*` path alias correctly configured via `path.resolve('./src')`.

---

## 21. Build / Lint / Test Results

### Lệnh 1: `npm run build`
```bash
> alsm-web-fe@0.0.0 build
> tsc -b && vite build

vite v8.2.2 building client environment for production...
transforming...
✓ 1877 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.87 kB │ gzip:   0.49 kB
dist/assets/index-BEorpQcx.css   32.35 kB │ gzip:   6.52 kB
dist/assets/index-BfnL7J33.js   504.43 kB │ gzip: 137.11 kB

✓ built in 896ms
```
- **Result**: **PASS (0 Errors, 0 Warnings)**

### Lệnh 2: `npm run lint`
```bash
> alsm-web-fe@0.0.0 lint
> oxlint

  ! react(only-export-components): Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components.
    ,-[src/app/providers.tsx:67:14]
 66 | 
 67 | export const useAuth = () => {
    :              ^^^^^^^
 68 |   const context = useContext(AuthContext);
    `----

Found 1 warning and 0 errors.
Finished in 23ms on 88 files with 116 rules using 16 threads.
```
- **Result**: **PASS (0 Errors, 1 Non-breaking Warning)**

---

## 22. Findings Table

| ID | Severity | Area | File | Finding | Evidence | Recommendation |
|---|---|---|---|---|---|---|
| ARCH-001 | HIGH | State | `src/features/*` | TanStack Query is configured in `app/` but completely unadopted across all feature pages. Server state is fetched via `useEffect` + `setState`. | `ScreensListPage.tsx:18`, `DiagnosticsPage.tsx:19` | Create feature query hooks (e.g. `useScreensQuery`, `useDiagnosticsQuery`) under `features/<feature>/queries/`. |
| AUTH-001 | HIGH | Auth | `src/app/router.tsx` | No `ProtectedRoute` or `GuestRoute` navigation guards wrap authenticated routes under `<AppLayout />`. | `router.tsx:45` | Implement a `ProtectedRoute` component checking `isAuthenticated` and redirecting unauthenticated users to `/login`. |
| STATE-001 | MEDIUM | State | `src/stores/*` | Zustand store files (`auth.store.ts`, `organization.store.ts`, `ui.store.ts`) export type interfaces and objects but do not call `create()`. | `auth.store.ts:9`, `organization.store.ts:6` | Instantiate active Zustand store hooks using `create<StoreState>()(...)`. |
| API-001 | MEDIUM | API | `src/services/api/` | `client.ts` is an unreferenced duplicate of `apiClient.ts` using relative imports. | `src/services/api/client.ts:1` | Delete `src/services/api/client.ts` to prevent developer confusion. |
| API-002 | MEDIUM | API | `src/services/api/apiClient.ts` | `apiClient.ts` lacks request/response interceptors for Authorization bearer token injection, X-Organization-Id header, and 401 token refresh. | `apiClient.ts:9-35` | Configure Axios request/response interceptors before connecting to NestJS backend API. |
| IMP-001 | LOW | Import | `src/app/providers.tsx` | `providers.tsx` imports directly from feature subfolders (`@/features/auth/services/auth.service`) instead of the public barrel (`@/features/auth`). | `providers.tsx:2-3` | Update imports to consume public barrel exports `@/features/auth`. |
| MOCK-001 | LOW | Mock | `src/features/billing/pages/UpgradeSubscriptionPage.tsx` | Hardcoded Starter plan price `$149/mo` in `UpgradeSubscriptionPage` conflicts with `mockSubscriptionPlans` (`$99/mo`). | `UpgradeSubscriptionPage.tsx:35` vs `billing.mock.ts:8` | Bind plan pricing dynamically to `billingService` / `mockSubscriptionPlans`. |

---

## 23. Architecture Compliance Matrix

| Architecture Rule | Compliance Status | Evidence |
|---|---|---|
| `app/` layer contains only composition | **COMPLIANT** | `src/app/` contains `App.tsx`, `providers.tsx`, `queryClient.ts`, `router.tsx`. |
| Features own domain components/pages | **COMPLIANT** | All 8 feature directories in `src/features/` contain dedicated `pages/`, `services/`, `types/`, and `index.ts`. |
| `shared/` does not import `features/` | **COMPLIANT** | Zero imports from `@/features/` found in `src/shared/`. |
| Server state not stored in Zustand | **COMPLIANT** | `src/stores/` contains no server entities (screens, projects, invoices). |
| API calls not made directly in components | **COMPLIANT** | Components exclusively call feature services (`screenService`, `projectService`, etc.). |
| TanStack Query actually used | **NON-COMPLIANT** | Configured in `app/`, but zero `useQuery` / `useMutation` calls in feature pages. |
| Organization Context centralized | **PARTIALLY COMPLIANT** | `organization.store.ts` defined, but not attached to HTTP headers or query keys. |
| No deep relative imports (`../../../`) | **COMPLIANT** | All cross-domain imports use `@/*` alias. |
| No confirmed circular dependencies | **COMPLIANT** | Import graph is strictly unidirectional (`app` → `features` → `shared`/`services`). |
| Mock data isolated in `src/mocks/` | **COMPLIANT** | All mock files reside in `src/mocks/` and are consumed via service layers. |

---

## 24. Recommended Fix Priority

> [!NOTE]  
> The following list contains recommendations only. No code implementation has been performed during this read-only audit.

### P0 — Must Fix Before Backend Integration
1. **API Interceptor Infrastructure (`API-002`)**: Add Axios interceptors to `apiClient.ts` for bearer token injection and `X-Organization-Id` header handling.
2. **Auth Navigation Guard (`AUTH-001`)**: Create `ProtectedRoute` to restrict unauthenticated access to `/projects/*`, `/billing/*`, `/usage`, and `/account/*`.

### P1 — Fix Soon
1. **TanStack Query Adoption (`ARCH-001`)**: Refactor `useEffect` + `setState` data fetching in feature pages to use TanStack Query hooks (`useQuery`, `useMutation`).
2. **Zustand Store Instantiation (`STATE-001`)**: Complete Zustand store instantiation in `src/stores/` (`auth.store.ts`, `organization.store.ts`, `ui.store.ts`) using `create()`.

### P2 — Cleanup
1. **Delete Duplicate Client (`API-001`)**: Remove `src/services/api/client.ts`.
2. **Barrel Export Imports (`IMP-001`)**: Standardize feature imports to use feature barrel exports (`@/features/auth`, `@/features/screens`, etc.).

### P3 — Optional
1. **Mock Price Data Consistency (`MOCK-001`)**: Synchronize `UpgradeSubscriptionPage` Starter plan display price with `mockSubscriptionPlans`.

---

## 25. Final Verdict

1. **Architecture Refactor Compliance**: The code structural migration to Feature-First architecture **successfully satisfies all layout and folder requirements** of `docs/01_architecture_ALSM.md`.
2. **Backend Integration Readiness**: **PARTIALLY READY**. The feature separation, type models, and mock service abstractions are well-structured. However, P0 items (API interceptors and ProtectedRoute guards) should be implemented prior to connecting live backend APIs.
3. **Must Fix Before Backend Integration**: `API-002` (Axios Interceptors / Bearer Token / Org Header) and `AUTH-001` (`ProtectedRoute` Guard).
4. **Deferrable Issues**: `ARCH-001` (TanStack Query migration) and `STATE-001` (Zustand instantiation) can be addressed incrementally.
5. **Source Code Empirical Evidence**: Verified by clean `npm run build` output (0 errors), clean `npm run lint` output (0 errors), and comprehensive code graph inspection across `src/`.
