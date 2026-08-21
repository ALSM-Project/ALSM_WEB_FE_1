# ALSM Frontend Guideline 02 — State Management

> Mục tiêu: mỗi loại state có đúng “owner”, tránh lưu mọi thứ vào Zustand hoặc dùng `useEffect` để tự fetch/caching.

---

## 1. Chiến lược tổng thể

ALSM chia state thành 5 nhóm:

1. **Local UI State** → `useState` / `useReducer`
2. **URL State** → React Router search params
3. **Cross-feature Client State** → Zustand
4. **Server State** → TanStack Query
5. **Form State** → React Hook Form hoặc local state tùy độ phức tạp

Nguyên tắc quan trọng:

> Dữ liệu có source of truth ở Backend thì mặc định là Server State, không phải Zustand State.

## 2. Decision Matrix

| Loại dữ liệu | Công cụ | Ví dụ ALSM |
|---|---|---|
| Modal open/close | `useState` | Export dialog |
| Tab đang chọn | `useState` hoặc URL | Preview / Code / Mapping |
| Search/filter/pagination | URL Search Params | Screen List |
| User authenticated | Zustand | current user/auth status |
| Current organisation | Zustand | selected organisation context |
| Sidebar collapsed | Zustand | App shell |
| Project list | TanStack Query | `GET projects` |
| Screen list | TanStack Query | project screens |
| Conversion job | TanStack Query | job status/progress |
| Invoice list | TanStack Query | billing history |
| Change password form | Form/local state | account security |
| Upload queue trước khi submit | local reducer | selected local files |
| Saved server-side field mappings | TanStack Query | mapping result |

## 3. Local UI State

Ưu tiên local state cho state chỉ có ý nghĩa trong một component/page.

```ts
const [isExportOpen, setExportOpen] = useState(false);
const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
```

Không tạo Zustand store chỉ để quản lý một modal.

### `useReducer`

Dùng khi state có nhiều transition liên quan chặt chẽ, ví dụ upload queue:

```text
ADD_FILES
REMOVE_FILE
START_UPLOAD
SET_PROGRESS
SET_READY
SET_FAILED
```

## 4. URL State

Search/filter/pagination nên có thể share/bookmark/reload.

Ví dụ:

```text
/projects/proj-acme/screens?search=login&status=completed&framework=react&page=2
```

Dùng URL state cho search, status filter, framework filter, page, sort và active tab nếu cần deep-link.

Không lưu các filter này đồng thời ở Zustand nếu không có lý do đặc biệt.

## 5. Zustand — Client State toàn cục

### 5.1 `auth.store.ts`

Chỉ giữ state cần cho client shell:

```ts
interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: AuthUser | null;
  accessToken?: string | null;
}
```

**Không mặc định persist refresh token trong localStorage.**

Preferred security model nếu backend hỗ trợ:

- access token: memory/client state;
- refresh token: HttpOnly + Secure + SameSite cookie.

Nếu backend hiện hành dùng contract khác, FE và BE phải chốt contract trước khi thay đổi.

### 5.2 `organization.store.ts`

ALSM có dữ liệu scoped theo organisation.

```ts
interface OrganizationState {
  currentOrganizationId: string | null;
  setCurrentOrganizationId(id: string | null): void;
}
```

Không lưu toàn bộ organization object lâu dài ở Zustand nếu object đó được fetch từ API. Organisation detail nên là TanStack Query data.

### 5.3 `ui.store.ts`

Chỉ giữ UI preference thật sự cross-page:

```ts
interface UIState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed(value: boolean): void;
}
```

Hiện visual direction là light theme; không thêm theme toggle nếu chưa có requirement.

## 6. TanStack Query — Server State

Mọi dữ liệu backend phải ưu tiên qua `useQuery` / `useMutation`.

### 6.1 Query Key Convention

Dùng query key có cấu trúc và chứa scope.

```ts
['projects', organizationId]
['project', organizationId, projectId]
['screens', organizationId, projectId, filters]
['screen', organizationId, projectId, screenId]
['conversionJob', organizationId, jobId]
['conversionResult', organizationId, screenId, versionId]
['fieldMappings', organizationId, screenId, versionId]
['usage', organizationId]
['subscription', organizationId]
['invoices', organizationId, filters]
['sessions', userId]
```

Không dùng query key chung chung như `['data']` hoặc `['list']`.

## 7. Queries theo Feature

```text
src/features/screens/queries/
├── screenKeys.ts
├── useScreens.ts
└── useScreen.ts
```

```ts
export const screenKeys = {
  all: (orgId: string, projectId: string) =>
    ['screens', orgId, projectId] as const,

  list: (orgId: string, projectId: string, filters: ScreenFilters) =>
    ['screens', orgId, projectId, filters] as const,
};
```

Mục tiêu là invalidation có chủ đích.

## 8. Mutation Rules

Ví dụ convert screen:

```ts
const mutation = useMutation({
  mutationFn: conversionService.createScreenConversion,
  onSuccess: (job) => {
    queryClient.invalidateQueries({
      queryKey: ['screens', organizationId, projectId],
    });

    queryClient.setQueryData(
      ['conversionJob', organizationId, job.id],
      job,
    );
  },
});
```

### Không optimistic update cho nghiệp vụ nguy hiểm

Không optimistic mark:

- payment = paid;
- conversion = completed;
- export = ready;
- subscription = upgraded.

Các trạng thái này phải dựa vào backend confirmation.

## 9. Cache Strategy đề xuất

| Data | Gợi ý |
|---|---|
| Subscription plans | 5–15 phút |
| Project list | 30–60 giây |
| Screen list | 15–30 giây |
| Conversion job đang chạy | polling 1–3 giây |
| Completed result | dài hơn / theo version |
| Usage | 30–60 giây |
| Invoices | 1–5 phút |
| Sessions | 30–60 giây |

Đây là guideline, có thể tuning theo backend và UX.

## 10. Conversion Job State

Conversion phải được model như server state có lifecycle.

```ts
type ConversionStatus =
  | 'queued'
  | 'processing'
  | 'validating'
  | 'review_required'
  | 'ready_for_export'
  | 'completed'
  | 'failed'
  | 'cancelled';
```

Nếu backend dùng enum khác, service adapter map sang UI model. Không để mỗi component tự map status bằng string tùy ý.

## 11. Polling Strategy

MVP có thể poll conversion job:

```ts
useQuery({
  queryKey: ['conversionJob', organizationId, jobId],
  queryFn: () => conversionService.getJob(jobId),
  refetchInterval: (query) => {
    const status = query.state.data?.status;
    return ['queued', 'processing', 'validating'].includes(status ?? '')
      ? 2000
      : false;
  },
});
```

Khi job terminal state thì dừng polling.

## 12. Form State

### Form đơn giản

`useState` đủ cho search, cancellation reason, small dialog.

### Form phức tạp

React Hook Form phù hợp cho Register, Change Password, Create Project, Field Mapping và Enterprise invitation sau này.

Validation frontend hỗ trợ UX nhưng Backend vẫn là source of truth.

## 13. Sensitive State

Password, OTP, 2FA secret và backup code không được persist vào localStorage, sessionStorage, Zustand persist hoặc URL.

Clear sensitive state khi submit thành công hoặc flow bị hủy.

## 14. Mock Data

Mock data dùng qua service abstraction.

Không viết hàng loạt mock object trực tiếp trong page lớn.

Nên:

```text
Page
  ↓
Query/Hook
  ↓
Service Interface
  ↓
Mock Adapter hoặc API Adapter
```

Mock phải có flag/development adapter rõ để tránh vô tình ship production data giả.

## 15. Persist Policy

Có thể persist:

- selected organisation id nếu hợp lý;
- sidebar collapsed;
- một số non-sensitive UI preference.

Không persist:

- password;
- OTP;
- 2FA secret;
- backup codes;
- refresh token nếu dùng HttpOnly cookie strategy;
- source code nhạy cảm chỉ để convenience.

## 16. Error State

TanStack Query error phải đi qua error normalization.

UI nên phân biệt:

- unauthenticated;
- forbidden;
- not found;
- validation error;
- quota exceeded;
- conversion failed;
- transient network error.

Không render mọi lỗi thành `Something went wrong`.

## 17. State Management Checklist

Trước khi thêm state mới, hỏi theo thứ tự:

1. State này chỉ dùng trong một component? → local.
2. Nó cần share/reload/back-forward? → URL.
3. Nó đến từ backend? → TanStack Query.
4. Nó là client state cross-feature? → Zustand.
5. Nó là form phức tạp? → form library.
6. Có cần persist không? Nếu có, có chứa sensitive data không?

Nếu không trả lời được câu 3–6, không thêm store mới.
