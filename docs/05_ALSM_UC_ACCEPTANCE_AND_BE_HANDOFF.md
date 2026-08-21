# ALSM — Frontend UC Acceptance & Backend Handoff Guideline

> Baseline nghiệp vụ: **FPT Refactored Main Baseline** hiện hành  
> Phạm vi acceptance hiện tại: **Public + Account/Security + Web 1 Self-Service**  
> Figma hiện tại: 25 top-level screens trong scope này, gồm Landing + UC-01 → UC-24.

---

## 1. Mục đích

Tài liệu này dùng để:

- nghiệm thu mức hoàn thiện Frontend theo từng Use Case;
- chỉ rõ màn nào đang dùng mock;
- chỉ rõ contract Backend còn thiếu;
- tránh việc FE và BE hiểu khác status/DTO;
- hỗ trợ thay mock bằng API thật theo từng feature;
- làm checklist trước integration demo.

Tài liệu này **không thay SRS**.

SRS quyết định business requirement. Figma quyết định visual/layout của màn hình. API/OpenAPI quyết định request/response contract. Guideline này quyết định cách team FE/BE handoff và nghiệm thu.

## 2. Stack FE chuẩn

Web 1:

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Zustand
- Axios

Backend dự kiến:

- NestJS
- MongoDB
- Redis/BullMQ cho conversion jobs

Không ghi Next.js/App Router vào tài liệu Web 1 hiện hành nếu source thực tế không dùng.

## 3. Quy ước trạng thái

| Status | Ý nghĩa |
|---|---|
| `Done` | UI hoàn chỉnh và gọi API thật đúng contract |
| `Partial` | Có UI/API nhưng thiếu state/DTO/edge case |
| `Mock` | UI hoạt động bằng mock/fallback, chưa dùng API thật |
| `Blocked` | FE không thể hoàn thiện vì thiếu contract/endpoint/decision |
| `Missing` | Chưa có UI hoặc chưa có implementation |
| `To Verify` | Có code nhưng chưa được nghiệm thu trực tiếp |

Không đánh dấu `Done` chỉ vì page render được.

## 4. Source-of-Truth Rule

Khi có xung đột:

1. **SRS baseline được phê duyệt** → business flow / rule / permission
2. **Figma** → layout / content hierarchy / interaction visual
3. **Swagger/OpenAPI hoặc BE contract đã chốt** → DTO/endpoint
4. **Frontend guideline** → architecture / implementation pattern

Không tự sửa SRS bằng code. Không tự sửa Figma business behavior nếu chưa có change request.

## 5. UC Numbering Baseline cho Web 1

Dùng numbering đang khớp Figma hiện tại:

| UC | Use Case |
|---|---|
| UC-01 | Register Account |
| UC-02 | Log In |
| UC-03 | Change Password |
| UC-04 | Enable Two-Factor Authentication |
| UC-05 | View and Manage Sessions |
| UC-06 | Forgot Password / Password Recovery |
| UC-07 | Create Project |
| UC-08 | Upload BMS or DSPF File |
| UC-09 | View Screen List |
| UC-10 | Convert Single Screen |
| UC-11 | Bulk Convert Screens |
| UC-12 | View Conversion Result |
| UC-13 | Preview User Interface |
| UC-14 | Edit Field Mapping Manually |
| UC-15 | Export Code |
| UC-16 | View Error Logs |
| UC-17 | Delete Project |
| UC-18 | View Subscription Plans |
| UC-19 | Start 14-Day Free Trial |
| UC-20 | Pay for Subscription with QR Code |
| UC-21 | Upgrade Subscription Plan |
| UC-22 | View Current Usage |
| UC-23 | View and Download Invoices |
| UC-24 | Cancel Subscription |

Landing Page là public screen nhưng không cần ép thành một UC mới.

Không renumber frontend theo các SRS cũ khác nếu chưa change-control.

## 6. Route Acceptance Map

| Screen / UC | Route đề xuất | Auth |
|---|---|---|
| Landing | `/` | Public |
| UC-01 Register | `/register` | Guest |
| UC-02 Login | `/login` | Guest |
| UC-03 Change Password | `/account/security/password` | Required |
| UC-04 2FA | `/account/security/2fa` | Required |
| UC-05 Sessions | `/account/security/sessions` | Required |
| UC-06 Forgot | `/forgot-password` | Public |
| Reset Password | `/reset-password` | Public with token |
| UC-07 Create Project | `/projects/new` | Required |
| UC-08 Upload | `/projects/:projectId/upload` | Required |
| UC-09 Screens | `/projects/:projectId/screens` | Required |
| UC-10 Convert | `/projects/:projectId/screens/:screenId/convert` | Required |
| UC-11 Bulk | `/projects/:projectId/screens/bulk-convert` | Required |
| UC-12 Result | `/projects/:projectId/screens/:screenId/result` | Required |
| UC-13 Preview | `/projects/:projectId/screens/:screenId/preview` | Required |
| UC-14 Mapping | `/projects/:projectId/screens/:screenId/mapping` | Required |
| UC-15 Export | `/projects/:projectId/export` hoặc dialog từ context | Required |
| UC-16 Diagnostics | `/projects/:projectId/diagnostics` | Required |
| UC-17 Delete | project context/dialog | Required |
| UC-18 Pricing | `/pricing` | Public/Auth |
| UC-19 Trial | `/billing/trial` | Required |
| UC-20 QR Payment | `/billing/payment` | Required |
| UC-21 Upgrade | `/billing/upgrade` | Required |
| UC-22 Usage | `/usage` | Required |
| UC-23 Invoices | `/billing/history` | Required |
| UC-24 Cancel | `/billing/subscription` | Required |

Route cụ thể có thể thay đổi nếu router hiện tại đã có convention tốt hơn, nhưng phải update bảng này.

## 7. UC Acceptance Matrix — Web 1

### UC-01 — Register Account

**FE acceptance**

- form match Figma;
- full name/email/password/confirm;
- password strength;
- terms checkbox;
- validation;
- success/error state;
- Google button theo UI nếu scope hỗ trợ.

**BE handoff cần**

- register endpoint;
- password policy;
- email verification policy;
- duplicate email error;
- response sau register;
- organisation/self-service membership creation behavior.

**Status:** `To Verify`

### UC-02 — Log In

**FE acceptance**

- email/username + password;
- remember UI nếu có;
- password visibility;
- loading/error;
- redirect;
- Google OAuth button nếu backend hỗ trợ.

**BE handoff cần**

- login endpoint;
- token/session contract;
- account locked/unverified errors;
- role/portal info;
- OAuth redirect/callback contract.

**Status:** `To Verify`

### UC-03 — Change Password

**FE acceptance**

- current/new/confirm;
- realtime password strength;
- last-five-password warning;
- session invalidation warning;
- validation/error messages.

**BE handoff cần**

- change password endpoint;
- current password invalid code;
- password history validation;
- session invalidation behavior.

**Status:** `To Verify`

### UC-04 — Enable 2FA

**FE acceptance**

- QR step;
- OTP verify;
- backup code step;
- backup codes shown once;
- no sensitive persistence.

**BE handoff cần**

- create/setup secret;
- QR/otpauth data;
- verify OTP;
- backup codes;
- failure/reset rules.

**Status:** `To Verify`

### UC-05 — View and Manage Sessions

**FE acceptance**

- active device list;
- current device;
- revoke one;
- revoke all others;
- correct empty/error state.

**BE handoff cần**

- list sessions;
- revoke session;
- revoke others;
- current session identifier.

**Status:** `To Verify`

### UC-06 — Password Recovery

**FE acceptance**

- request;
- email sent;
- expiry/cooldown display;
- reset form;
- password rules;
- success state.

**BE handoff cần**

- forgot-password;
- reset-password;
- token expiry/single-use;
- generic response for unknown email.

**Status:** `To Verify`

### UC-07 — Create Project

**FE acceptance**

- name/description;
- quota display;
- create/cancel;
- loading/error;
- navigate to created project.

**BE handoff cần**

- create project;
- plan quota error;
- organisation scoping;
- returned project DTO.

**Status:** `To Verify`

### UC-08 — Upload BMS/DSPF

**FE acceptance**

- drag/drop;
- file browse;
- file validation;
- progress;
- ready/failed;
- retry/remove nếu supported;
- max-file-count rule visible khi relevant.

**BE handoff cần**

- multipart endpoint;
- accepted extension/MIME;
- size limit;
- project file limit;
- parse/validation response.

**Status:** `To Verify`

### UC-09 — View Screen List

**FE acceptance**

- summary metrics;
- Screens/Programs tab behavior theo current scope;
- search;
- status/framework filter;
- pagination;
- correct status badge;
- open Studio.

**BE handoff cần**

- paginated screen list;
- filters;
- summary counts;
- framework/status enum.

**Status:** `To Verify`

### UC-10 — Convert Single Screen

**FE acceptance**

- framework selection;
- run conversion;
- queued/processing/success/failure states;
- result tabs;
- no fake instant success in production adapter.

**BE handoff cần**

- create conversion job;
- quota error;
- job DTO;
- result link/id;
- terminal status enum.

**Status:** `To Verify`

### UC-11 — Bulk Convert Screens

**FE acceptance**

- select;
- select all;
- clear;
- filter;
- selected count;
- target framework;
- estimated credit/time UI;
- job/batch progress.

**BE handoff cần**

- bulk job endpoint;
- batch status;
- per-screen result;
- quota behavior nếu partial capacity.

**Status:** `To Verify`

### UC-12 — View Conversion Result

**FE acceptance**

- generated code;
- metadata;
- AST tree;
- findings/validator state;
- links to preview/mapping/export.

**BE handoff cần**

- conversion result DTO;
- generated code;
- AST shape;
- findings;
- version id;
- confidence/severity nếu used.

**Status:** `To Verify`

### UC-13 — Preview UI

**FE acceptance**

- real rendered preview component/iframe strategy;
- desktop/tablet/mobile width;
- interactive toggle nếu supported;
- loading/error.

**BE handoff cần**

- preview artifact/content;
- safe preview strategy;
- CSP/sandbox requirement nếu iframe used.

**Status:** `To Verify`

### UC-14 — Edit Field Mapping

**FE acceptance**

- legacy field list;
- select field;
- editable component mapping;
- validation rules;
- save;
- regeneration/re-conversion feedback.

**BE handoff cần**

- mapping GET;
- mapping PATCH/PUT;
- validation;
- version/re-conversion behavior.

**Status:** `To Verify`

### UC-15 — Export Code

**FE acceptance**

- output options;
- framework version;
- package preview;
- export loading;
- download handling;
- clear failure state.

**BE handoff cần**

- export eligibility;
- export request;
- artifact download URL/stream;
- version exported;
- audit data.

**Status:** `To Verify`

### UC-16 — View Error Logs

**FE acceptance**

- search/filter;
- log list;
- selected diagnostic detail;
- source line;
- suggested fix;
- retry action state.

**BE handoff cần**

- error list/detail;
- error code/severity;
- source location;
- suggested patch nếu available;
- retry endpoint.

**Status:** `To Verify`

### UC-17 — Delete Project

**FE acceptance**

- confirm modal;
- exact project name confirmation;
- 30-day soft-delete message;
- success/error.

**BE handoff cần**

- soft-delete endpoint;
- recoverability policy;
- conflict nếu active jobs;
- audit behavior.

**Status:** `To Verify`

### UC-18 — View Subscription Plans

**FE acceptance**

- Starter/Professional/Enterprise;
- monthly/annual toggle nếu current plan contract supports;
- plan features;
- CTA;
- public route.

**BE handoff cần**

- plan list;
- price/currency;
- billing interval;
- limits/features;
- active flag.

**Status:** `To Verify`

### UC-19 — Start 14-Day Free Trial

**FE acceptance**

- plan summary;
- timeline;
- activate;
- already-used-trial handling.

**BE handoff cần**

- activate trial;
- eligibility;
- start/end date;
- current subscription response.

**Status:** `To Verify`

### UC-20 — QR Payment

**FE acceptance**

- QR;
- amount;
- invoice/reference;
- 15-minute countdown theo baseline nếu contract giữ rule này;
- waiting/paid/expired/failed;
- không tự mark paid.

**BE handoff cần**

- create payment/invoice;
- QR payload/image;
- expiry;
- payment status endpoint;
- webhook updates status.

**Status:** `To Verify`

### UC-21 — Upgrade Subscription

**FE acceptance**

- current/target plan;
- prorated summary;
- confirmation;
- pending payment flow.

**BE handoff cần**

- upgrade quote;
- prorated amount;
- payment/invoice;
- activation rule.

**Status:** `To Verify`

### UC-22 — View Current Usage

**FE acceptance**

- screen usage;
- project usage;
- storage;
- chart;
- quota states;
- upgrade CTA.

**BE handoff cần**

- usage endpoint;
- plan limits;
- billing period;
- screen/program counters nếu current scope trả cả hai.

**Status:** `To Verify`

### UC-23 — View and Download Invoices

**FE acceptance**

- invoice list;
- search/filter;
- pagination;
- status;
- PDF/download action.

**BE handoff cần**

- invoice list;
- invoice detail;
- download/PDF;
- payment method/status.

**Status:** `To Verify`

### UC-24 — Cancel Subscription

**FE acceptance**

- current plan;
- effective-end-date copy;
- cancellation reason;
- optional feedback;
- confirm state.

**BE handoff cần**

- cancel-at-period-end;
- cancellation status;
- effective date;
- resume/reactivate behavior nếu có.

**Status:** `To Verify`

## 8. Mock Data Policy

Mock được phép khi Backend chưa đủ contract.

Mock phải:

- nằm riêng;
- được đánh dấu rõ;
- dùng cùng UI model như API adapter;
- có đường thay bằng API thật.

Không dùng mock để che endpoint đang lỗi mà không báo team.

Mỗi feature nên có bảng:

| Feature | Mock hiện tại | API target | Owner | Deadline |
|---|---|---|---|---|

## 9. Backend Contract Checklist

Mỗi FE↔BE handoff phải chốt:

- endpoint;
- method;
- auth;
- organisation scope;
- permission;
- DTO;
- status enum;
- pagination;
- validation;
- domain error code;
- idempotency;
- upload limit;
- async job behavior;
- example request/response.

Swagger/OpenAPI nên là artifact kiểm chứng contract.

## 10. Conversion DTO tối thiểu cần chốt

### Screen

```text
id
projectId
name
sourceType
status
framework
updatedAt
```

### Conversion Job

```text
id
screenId
projectId
status
progress?
attemptCount?
createdAt
startedAt?
completedAt?
error?
```

### Conversion Result

```text
id
jobId
screenId
version
generatedCode
ast?
fieldMappings?
findings?
metrics?
createdAt
```

Tên field thật phải theo BE contract; đây là checklist semantics, không phải yêu cầu đổi database.

## 11. Billing DTO tối thiểu cần chốt

### Plan

```text
id
name
price
currency
interval
features
limits
isActive
```

### Subscription

```text
id
plan
status
currentPeriodStart
currentPeriodEnd
trialEnd?
cancelAtPeriodEnd
```

### Invoice / Payment

```text
id
invoiceNumber
amount
currency
status
paymentMethod
createdAt
paidAt?
downloadUrl?
qr?
expiresAt?
```

## 12. Seed Data cho Integration Demo

Nên có tối thiểu:

- 1 self-service user;
- 1 project;
- 4–6 screens;
- status gồm Completed / Processing / Review Required / Failed;
- ít nhất 1 conversion result;
- ít nhất 1 diagnostic log;
- 3 pricing plans;
- 1 active subscription;
- vài invoice;
- usage data khác 0;
- 1 payment pending hoặc test flow.

Data seed phải không chứa dữ liệu khách hàng thật.

## 13. Integration Priority

Thứ tự khuyến nghị:

1. Auth bootstrap/login
2. Organisation context
3. Project CRUD
4. Screen upload/list
5. Single conversion job
6. Conversion job polling
7. Result/AST/mapping
8. Diagnostics/retry
9. Export
10. Usage
11. Plans/trial
12. QR payment
13. Upgrade/cancel/invoices
14. 2FA/sessions nếu chưa nối trước

## 14. Current-scope note về COBOL

ALSM có COBOL-to-Java trong product scope. Tuy nhiên bộ 25 màn Figma Web 1 hiện tại chủ yếu mô tả account, BMS/DSPF screen conversion và billing.

Frontend có thể giữ `Programs` tab/reserved architecture, nhưng:

- không được đánh dấu COBOL FE là `Done` nếu chưa có màn/result/mapping/export tương ứng;
- không trộn screen conversion DTO và program conversion DTO;
- khi UC COBOL được triển khai, tạo feature/domain riêng dùng chung project shell.

## 15. Acceptance Evidence

Một UC chỉ chuyển `To Verify` → `Done` khi có bằng chứng:

- route chạy;
- UI match Figma ở mức được chấp nhận;
- primary interaction hoạt động;
- API thật trả dữ liệu đúng;
- error state được test;
- build/lint pass;
- không có console error major;
- permission/quota rule được kiểm tra nếu liên quan.

## 16. Definition of Done cho FE↔BE

Một feature tích hợp được coi là hoàn tất khi:

- không còn mock trong happy path;
- DTO đã chốt;
- error code được handle;
- auth/org scope đúng;
- loading/empty/error state có;
- retry/polling không gây request storm;
- API error không leak sensitive data;
- Swagger và FE types không mâu thuẫn;
- acceptance matrix được cập nhật.

## 17. Change Control

Nếu SRS, Figma và implementation khác nhau:

1. tạo issue/change request;
2. chỉ rõ artifact nào cần đổi;
3. thống nhất owner;
4. update SRS/Figma/API hoặc code;
5. update acceptance matrix.

Không “sửa tạm trong code rồi để đó”.

## 18. Baseline Rules quan trọng

Các rule cần FE thể hiện đúng UX khi backend enforce:

- new password không được trùng 5 password gần nhất;
- backup codes 2FA chỉ hiển thị một lần;
- project quota theo plan;
- soft-deleted project có thời gian recovery theo baseline;
- mỗi account chỉ dùng một free trial;
- QR payment có expiry và backend confirmation;
- upgrade có prorated billing;
- cancel subscription có hiệu lực cuối kỳ;
- conversion có thể fail/retry/review, không phải luôn success.

Backend là source of truth enforcement cho các rule này.
