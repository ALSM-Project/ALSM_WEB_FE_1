# ALSM Frontend Guideline 01 — Architecture & Project Structure

> Project: **ALSM — Automating Legacy System Modernization**  
> Scope hiện tại: **Web 1 — Self-Service Frontend**  
> Định hướng mở rộng: Web 2 — Internal và Web 3 — Enterprise dùng cùng nguyên tắc kiến trúc, nhưng không trộn nghiệp vụ vào Web 1 khi chưa triển khai.

---

## 1. Mục tiêu của tài liệu

Tài liệu này định nghĩa kiến trúc frontend chuẩn cho ALSM để:

- code bám đúng nghiệp vụ và Figma;
- frontend có thể phát triển độc lập khi backend chưa hoàn chỉnh;
- giảm phụ thuộc mock khi API thật sẵn sàng;
- dễ mở rộng từ Web 1 sang Web 2/Web 3;
- tránh việc mỗi developer hoặc AI agent tự chọn một kiến trúc khác nhau;
- giữ conversion workflow, billing, authentication và organisation context tách biệt rõ ràng.

Nguồn nghiệp vụ chính cần ưu tiên là **SRS/FPT Refactored Main Baseline hiện hành**. Figma là source of truth cho visual/layout của các màn đã thiết kế.

## 2. Technology Stack chuẩn

Frontend Web 1 sử dụng:

- **React**
- **Vite**
- **TypeScript**
- **Tailwind CSS**
- **React Router**
- **TanStack Query**
- **Zustand**
- **Axios** cho API client
- `lucide-react` hoặc icon library hiện tại nếu đã thống nhất

Không chuyển sang Next.js chỉ vì một dự án mẫu khác dùng Next.js.

### 2.1 Vì sao dùng React + Vite

Web 1 là một application/dashboard có authentication, account security, project workspace, upload, conversion studio, code/result inspection, billing và usage dashboard. Các flow này chủ yếu là client-side interaction. React + Vite phù hợp với source hiện tại và không tạo migration cost không cần thiết.

### 2.2 Không thêm framework lớn nếu không cần

Không tự động thêm Next.js, Redux Toolkit, Material UI, Ant Design, Bootstrap hoặc một design system bên thứ ba thay cho Figma. Dependency mới phải có lý do rõ ràng và được ghi trong PR/commit description.

## 3. Architectural Style: Feature-First

ALSM dùng **Feature-First Architecture**. Mỗi domain chính được đóng gói theo feature thay vì để hàng trăm file nghiệp vụ khác nhau trộn trong `components/`, `pages/`, `hooks/`, `services/` dùng chung.

### 3.1 Cấu trúc đề xuất

```text
ALSM_WEB_FE/
├── public/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   ├── providers.tsx
│   │   └── queryClient.ts
│   ├── features/
│   │   ├── auth/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── queries/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── account/
│   │   ├── projects/
│   │   ├── screens/
│   │   ├── conversion/
│   │   ├── diagnostics/
│   │   ├── billing/
│   │   └── usage/
│   ├── shared/
│   │   ├── ui/
│   │   ├── layouts/
│   │   ├── navigation/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types/
│   │   └── constants/
│   ├── services/
│   │   └── api/
│   │       ├── apiClient.ts
│   │       ├── apiError.ts
│   │       └── tokenRefresh.ts
│   ├── stores/
│   │   ├── auth.store.ts
│   │   ├── organization.store.ts
│   │   └── ui.store.ts
│   ├── mocks/
│   ├── styles/
│   └── main.tsx
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 4. Trách nhiệm của từng layer

### `src/app/`

Chỉ chứa application composition: router, providers, QueryClient, global error boundary và app bootstrap. Không viết business logic lớn hoặc page UI dài trực tiếp tại đây.

### `src/features/`

Chứa business feature. Ví dụ:

```text
src/features/conversion/
├── pages/
│   ├── ConvertScreenPage.tsx
│   ├── BulkConvertPage.tsx
│   ├── ResultInspectionPage.tsx
│   └── PreviewStudioPage.tsx
├── components/
│   ├── ConversionMetrics.tsx
│   ├── CodeViewer.tsx
│   └── ASTTree.tsx
├── hooks/
├── queries/
├── services/
├── types/
└── index.ts
```

Component chỉ dùng bên trong feature phải ở trong feature đó.

### `src/shared/`

Chỉ dành cho code thật sự dùng ở nhiều feature: Button, Input, Modal, Table, Badge, Header, Breadcrumb, Pagination và common layout. Không đưa component vào `shared` chỉ vì “có thể sau này sẽ dùng”.

### `src/services/api/`

Chứa infrastructure cho HTTP: Axios instance, request/response interceptors, token refresh coordination và error normalization. Không chứa business-specific rendering logic.

### `src/stores/`

Chỉ chứa **cross-feature client state**. Không biến Zustand thành database phía client.

### `src/mocks/`

Chứa mock/fallback data trong giai đoạn backend chưa đủ contract. Mock phải có thể thay bằng API thật mà không rewrite page.

## 5. Domain Boundary của ALSM

### Auth
- register;
- login;
- OAuth;
- forgot/reset password;
- auth session bootstrap.

### Account
- change password;
- 2FA;
- active sessions.

### Projects
- project list/detail;
- create/delete;
- project quota;
- project navigation.

### Screens
- upload BMS/DSPF;
- screen list;
- screen metadata.

### Conversion
- run single conversion;
- bulk conversion;
- conversion result;
- preview;
- field mapping;
- export.

### Diagnostics
- conversion errors;
- source line;
- findings;
- suggested fix;
- retry.

### Billing
- plans;
- trial;
- QR payment;
- upgrade;
- invoices;
- cancellation.

### Usage
- screen quota;
- project quota;
- storage;
- conversion volume.

## 6. Design System & Figma

Figma là source of truth cho layout, typography hierarchy, spacing, color intent, table structure, form hierarchy, modal, tab, status và responsive composition.

### 6.1 Visual direction hiện hành

ALSM Web 1 dùng **Light Enterprise SaaS Theme**:

- light application shell;
- white surface/card;
- enterprise blue primary;
- subtle borders;
- semantic green/amber/red;
- monospace chỉ dùng cho technical data;
- dark code surface được phép trong Code Viewer/COBOL/Java/AST khi cần.

Không quay lại dark/cyber/neon theme nếu chưa có design change được phê duyệt.

### 6.2 Branding

- **ALSM** = product/platform;
- **MODERNIZER** = AI assistant/engine nếu feature cần.

Không dùng MODERNIZER như tên toàn bộ application trừ khi branding chính thức thay đổi.

## 7. Portal Strategy

Hiện tại `ALSM_WEB_FE` tập trung vào **Web 1**. Không nhét Web 2 và Web 3 vào Web 1 chỉ để “chuẩn bị trước”.

Khi bắt đầu Web 2/Web 3, team có thể tạo frontend app riêng nhưng dùng cùng conventions, hoặc chuyển sang workspace/monorepo nếu shared code thực sự đủ lớn.

Nếu dùng monorepo sau này, mục tiêu có thể là:

```text
apps/
  web1/
  web2/
  web3/
packages/
  ui/
  design-tokens/
  api-contracts/
  auth/
```

Không migration sang monorepo trước khi có nhu cầu thực.

## 8. Component Rules

Component nên tách khi dùng ở nhiều vị trí, page có section độc lập rõ, có state/interaction riêng hoặc có thể test độc lập.

Page không nên:

- dài hàng nghìn dòng;
- trực tiếp gọi Axios;
- chứa toàn bộ mock object;
- chứa token logic;
- chứa query cache logic lặp lại.

## 9. TypeScript Rules

- bật strict mode nếu source hiện tại cho phép;
- không dùng `any` tùy tiện;
- API DTO và UI model có thể khác nhau;
- service layer chịu trách nhiệm normalize khi cần.

Ví dụ:

```ts
export interface ScreenSummary {
  id: string;
  projectId: string;
  name: string;
  sourceType: 'BMS' | 'DSPF';
  status: ScreenStatus;
  framework?: TargetFramework;
  updatedAt: string;
}
```

Không phụ thuộc UI trực tiếp vào shape MongoDB nếu không cần.

## 10. Import Boundary

Khuyến nghị alias:

```text
@/app
@/features
@/shared
@/services
@/stores
@/mocks
```

Feature không được import file private của feature khác bằng path sâu nếu đã có public export.

## 11. Quy tắc cho Conversion Workflow

Conversion là core domain của ALSM. UI phải phản ánh workflow có thể truy vết:

```text
Upload
→ Validate Input
→ Queue
→ Processing
→ Validation
→ Review / Finding
→ Correction
→ Re-conversion
→ Ready for Export
→ Export
```

Không giả định conversion thành công ngay. Các trạng thái lỗi/warning/review phải là first-class UI state. AI Validator chỉ là advisory; UI không được tự động thể hiện AI finding như quyết định cuối cùng nếu SRS không cho phép.

## 12. Những pattern cấm

Không:

- gọi Axios trực tiếp trong component;
- lưu server entities dài hạn trong Zustand;
- hardcode API base URL;
- hardcode organisation ID trong component;
- hardcode role check ở hàng chục page;
- duplicate Header/Layout;
- duplicate status color mapping;
- dùng screenshot Figma làm UI;
- tự đổi UC numbering;
- tự thêm Next.js;
- tự thêm dark mode;
- tự mix Web 2/Web 3 vào Web 1.

## 13. Definition of Done cho architecture change

Một architecture change chỉ được accept khi:

- build pass;
- lint pass;
- route hiện tại không hỏng;
- không tạo circular dependency đáng kể;
- không phá mock/API abstraction;
- có migration rõ nếu thay folder;
- không thay business requirement chỉ vì refactor code.
