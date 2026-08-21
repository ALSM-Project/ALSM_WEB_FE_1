# ALSM Frontend Guideline 03 — Routing, Authentication & Authorization

> Stack áp dụng: **React Router + Vite**, không dùng Next.js App Router.

---

## 1. Mục tiêu

Routing của ALSM phải:

- phản ánh rõ domain;
- hỗ trợ deep-link;
- không hardcode role logic ở từng page;
- chuẩn bị cho một authentication system dùng chung giữa các portal;
- đảm bảo organisation context nhất quán;
- không coi frontend guard là security boundary.

## 2. Source of Truth về UC numbering

Frontend guideline này dùng **FPT Refactored Main Baseline** hiện hành cho Web 1:

- UC-01 → UC-06: Public/Account Security
- UC-07 → UC-17: Project & Screen Conversion
- UC-18 → UC-24: Subscription & Billing

Đây cũng là numbering đang khớp với các frame Figma Web 1 hiện tại.

Không tự lấy numbering từ các bản SRS cũ hơn và đổi component/route theo chúng. UC ID không nên nằm trong URL.

## 3. Route Structure — Web 1

### Public

```text
/
/register
/login
/forgot-password
/reset-password
/pricing
```

### Account Security

```text
/account/security/password
/account/security/2fa
/account/security/sessions
```

### Projects / Screens

```text
/projects
/projects/new
/projects/:projectId
/projects/:projectId/upload
/projects/:projectId/screens
/projects/:projectId/screens/bulk-convert
/projects/:projectId/screens/:screenId/convert
/projects/:projectId/screens/:screenId/result
/projects/:projectId/screens/:screenId/preview
/projects/:projectId/screens/:screenId/mapping
/projects/:projectId/export
/projects/:projectId/diagnostics
```

### Billing / Usage

```text
/billing/trial
/billing/payment
/billing/upgrade
/billing/history
/billing/subscription
/usage
```

`/pricing` có thể public; các action purchase/upgrade yêu cầu authenticated state.

## 4. Router Composition

```tsx
createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/pricing', element: <PricingPage /> },
    ],
  },
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // authenticated Web 1 routes
        ],
      },
    ],
  },
]);
```

Không copy full layout vào từng page.

## 5. Guard Types

### 5.1 GuestRoute

Dành cho login/register. Nếu user đã authenticated, redirect về route phù hợp.

### 5.2 ProtectedRoute

Nếu chưa authenticated:

- redirect `/login`;
- lưu `returnTo` nếu cần;
- sau login thành công quay lại route hợp lệ.

### 5.3 Role / Permission Guard

Dùng khi feature yêu cầu role/permission.

```tsx
<PermissionGuard permission="project.delete">
  <DeleteProjectButton />
</PermissionGuard>
```

Không hardcode `user.role === ...` ở hàng chục nơi.

### 5.4 OrganizationGuard

Nếu route dùng dữ liệu organisation-scoped:

- phải có current organisation hợp lệ;
- membership/permission phải được backend xác nhận;
- request phải gửi organisation context theo contract.

## 6. Authentication Flow

### Register — UC-01

1. validate form;
2. gọi register API;
3. hiển thị success/error;
4. xử lý email verification theo backend contract nếu được bật;
5. redirect hợp lý.

Không tự giả định account đã active nếu backend yêu cầu verify email.

### Login — UC-02

1. nhập email/password;
2. gọi login API;
3. nhận user/auth state;
4. resolve role/portal;
5. redirect.

Figma có Google button. Nếu OAuth backend chưa có, UI có thể disabled/mock trong dev nhưng không giả lập production login thành công.

### Forgot Password — UC-06

1. user nhập email;
2. frontend gọi forgot-password;
3. hiển thị generic message phù hợp;
4. reset token không đưa vào application state;
5. `/reset-password?token=...` chỉ dùng token để submit reset.

### Change Password — UC-03

Frontend phải chuẩn bị nhận trạng thái success, current password invalid, password reused và validation error. Sau change password thành công, xử lý session invalidation theo backend/SRS contract.

### 2FA — UC-04

```text
Setup
→ Scan QR
→ Verify OTP
→ Show Backup Codes
→ Completed
```

Backup code không persist.

### Sessions — UC-05

- list active sessions;
- current session được đánh dấu;
- revoke individual;
- revoke all others nếu backend hỗ trợ;
- invalidated current auth phải đưa user về login.

## 7. Token Strategy

Preferred pattern nếu backend hỗ trợ:

```text
Access Token
→ memory / auth store

Refresh Token
→ HttpOnly + Secure + SameSite cookie
```

Nếu backend hiện hành trả refresh token trong body, team phải thống nhất migration plan; không tự đổi một phía.

Không lưu password hoặc OTP.

## 8. Auth Bootstrap

Khi app load:

```text
loading
→ resolve session
→ authenticated / unauthenticated
```

ProtectedRoute không redirect quá sớm trước khi bootstrap xong.

## 9. Organisation Context

ALSM scoping dữ liệu theo organisation.

Nếu backend contract yêu cầu:

```http
x-organization-id: <organizationId>
```

thì header phải được gắn ở API infrastructure, không ở từng component.

Frontend route `projectId` không đủ để thay thế organisation authorization. Backend vẫn phải verify user → membership → organisation → project.

## 10. Role & Permission Model

Web 1 hiện chủ yếu là Self-service Customer. Shared auth model nên đủ để future portal hiểu các role/permission như:

- self_service;
- enterprise_admin;
- enterprise_member;
- enterprise_viewer;
- conversion_staff;
- internal_developer;
- internal_support;
- internal_sales;
- sales_manager;
- platform_admin.

Không giả định role list bằng UI text nếu backend có enum chính thức khác.

Frontend chỉ quyết định show/hide, enable/disable và redirect UX. Backend là nơi enforce quyền thật.

## 11. Route → Data Validation

Dynamic route phải validate data.

Ví dụ:

```text
/projects/:projectId/screens/:screenId/result
```

Service/query phải đảm bảo screen thuộc project/org context.

Nếu backend trả 403 → Forbidden UX; 404 → Not Found; 409 → domain conflict. Không redirect mọi lỗi về dashboard.

## 12. Search Parameters

Dùng query string cho state như:

```text
/projects/:projectId/screens?search=login&status=completed&framework=react&page=2
```

Đây là routing state, không phải Zustand state.

## 13. Route Naming Rules

- lowercase;
- kebab-case;
- URL phản ánh resource/business;
- không nhét UC number vào URL;
- không đổi route chỉ để giống title Figma.

## 14. Portal Redirect Strategy

SRS mô tả một authentication system dùng chung và redirect theo role. Trong giai đoạn Web 1 standalone, `/login` phục vụ Web 1 và auth model không hardcode assumption chỉ có self-service mãi mãi.

Khi Web 2/Web 3 được triển khai, redirect có thể trỏ cùng origin khác path hoặc app/domain khác tùy deployment được chốt sau.

Không đưa Web 2/Web 3 routes vào Web 1 trước khi team quyết định deployment model.

## 15. Error Routes

Nên có:

```text
/403
/404
```

Unauthorized API response: thử refresh auth nếu hợp lệ; nếu không phục hồi được → logout + `/login`.

Forbidden: không logout; hiển thị 403.

## 16. Routing & Auth Checklist

Trước khi merge route mới:

- có thuộc đúng layout không?
- public hay protected?
- có organisation scope không?
- cần permission gì?
- page reload trực tiếp có chạy không?
- back/forward có giữ filter hợp lý không?
- 401 và 403 được xử lý khác nhau chưa?
- route có dependency vào UC numbering không?
- có duplicate auth check trong page không?
