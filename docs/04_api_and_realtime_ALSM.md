# ALSM Frontend Guideline 04 — API Integration, Conversion Progress & Realtime

> Mục tiêu: component không gọi HTTP trực tiếp; toàn bộ API có contract rõ, organisation scope rõ, auth refresh an toàn và conversion status có chiến lược cập nhật nhất quán.

---

## 1. API Architecture

Luồng chuẩn:

```text
Page / Component
      ↓
Feature Query / Hook
      ↓
Feature Service
      ↓
Shared API Client
      ↓
NestJS Backend
```

Không gọi `axios` trực tiếp trong component.

## 2. API Client

File đề xuất:

```text
src/services/api/apiClient.ts
```

Environment:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_TIMEOUT_MS=30000
```

Không hardcode backend URL trong feature.

## 3. Axios Instance

```ts
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  withCredentials: true,
});
```

`withCredentials` chỉ bật nếu auth/cookie contract yêu cầu.

## 4. Request Interceptor

Request interceptor có thể chịu trách nhiệm:

- Authorization header;
- organisation header;
- correlation/request ID nếu backend hỗ trợ.

Ví dụ:

```http
Authorization: Bearer <accessToken>
x-organization-id: <organizationId>
```

Không để mỗi service tự lấy organisation store nếu infrastructure có thể làm thống nhất.

## 5. Response Interceptor & Token Refresh

Khi `401`:

1. xác định request có được retry không;
2. chỉ chạy **một refresh request** tại một thời điểm;
3. các request 401 đồng thời chờ refresh;
4. refresh thành công → retry;
5. refresh thất bại → clear auth + redirect login.

Phải tránh refresh storm và retry vô hạn. Request refresh endpoint không được tự trigger interceptor loop.

## 6. Error Normalization

UI không phụ thuộc trực tiếp vào shape `AxiosError`.

```ts
export interface ApiError {
  status?: number;
  code?: string;
  message: string;
  fieldErrors?: Record<string, string>;
  details?: unknown;
}
```

Service/API layer normalize backend error.

UI nên phân biệt domain error như invalid credentials, account locked, quota exceeded, unsupported file, conversion failure, payment pending và permission denied. Tên error code phải theo backend contract thật; không tự phát minh contract chỉ vì guideline có ví dụ.

## 7. Service Layer

Ví dụ:

```text
src/features/projects/services/project.service.ts
src/features/screens/services/screen.service.ts
src/features/conversion/services/conversion.service.ts
src/features/billing/services/billing.service.ts
```

Service:

- gọi endpoint;
- normalize DTO;
- không render UI;
- không chứa Toast;
- không redirect router trực tiếp trừ auth infrastructure được thiết kế rõ.

## 8. DTO vs UI Model

Không bắt UI phụ thuộc toàn bộ MongoDB response.

Nếu backend trả `_id`, `organization_id`, `updated_at`, service có thể normalize thành `id`, `organizationId`, `updatedAt` nếu team đã chọn convention đó.

Không vừa dùng `id`, vừa dùng `_id` tùy component.

## 9. TanStack Query Integration

Service không tự cache. Cache do TanStack Query quản lý.

```ts
useQuery({
  queryKey: ['screens', organizationId, projectId, filters],
  queryFn: () =>
    screenService.list({
      organizationId,
      projectId,
      filters,
    }),
});
```

## 10. File Upload

BMS/DSPF upload dùng browser `File` + multipart theo backend contract.

Frontend validate sớm:

- extension;
- size;
- max count.

Backend vẫn validate lại. Không coi client validation là security.

Upload progress có thể lấy từ Axios `onUploadProgress` nếu backend/proxy hỗ trợ.

### Source file security

Không:

- log raw legacy source vào console;
- persist source file content vào localStorage;
- gửi source code sang dịch vụ AI trực tiếp từ frontend.

AI/validator integration phải đi qua backend policy.

## 11. Conversion Job Flow

Frontend không thực hiện conversion algorithm.

```text
FE
→ Create Conversion Job
→ Backend / Queue
→ Worker
→ Job Status
→ Result
→ FE
```

FE chỉ submit, track, render status, show result/finding, submit correction, trigger re-conversion và export khi backend cho phép.

## 12. Polling là Default MVP Strategy

Nếu backend chưa có WebSocket/SSE, dùng polling qua TanStack Query.

```ts
refetchInterval: (query) => {
  const status = query.state.data?.status;

  if (
    status === 'queued' ||
    status === 'processing' ||
    status === 'validating'
  ) {
    return 2000;
  }

  return false;
}
```

Ưu điểm: đơn giản, ít infrastructure, dễ debug và đủ cho MVP/capstone.

Không thêm Socket.IO chỉ vì dự án mẫu khác dùng Socket.IO.

## 13. Realtime — Khi nào cần

Chỉ triển khai WebSocket/SSE khi:

- backend đã có gateway/event contract;
- polling gây tải đáng kể;
- UX cần progress realtime;
- event ownership rõ.

### Event convention đề xuất nếu backend chọn realtime

Đây là **đề xuất**, không phải contract hiện có:

```text
conversion:queued
conversion:started
conversion:progress
conversion:validation
conversion:completed
conversion:failed
bulk-conversion:progress
notification:new
```

Payload nên có event id, organisation id, project/job id, timestamp, status và progress nếu có.

Backend phải authorize socket connection/room. Frontend không được tin event từ organisation khác.

## 14. Realtime + Query Cache

Realtime event không nên tạo một state system song song.

```text
socket event
→ queryClient.setQueryData(...)
hoặc
→ invalidateQueries(...)
```

TanStack Query vẫn là source of truth phía client cho server data.

## 15. Payment Flow

Web 1 current baseline dùng QR payment.

Frontend:

1. request/create payment;
2. hiển thị QR;
3. hiển thị expiry countdown;
4. query payment status;
5. backend xử lý webhook;
6. FE nhận status qua polling/realtime;
7. chỉ khi backend confirm mới mark paid.

Frontend không verify webhook signature. Webhook là backend responsibility.

Không tự set payment success sau countdown hoặc button giả.

## 16. Retry Policy

### Query GET

Có thể retry transient network/5xx với giới hạn.

Không retry tự động 401 ngoài auth refresh flow.

### Mutation

Không auto retry tùy tiện cho:

- create project;
- conversion start;
- payment;
- upgrade;
- delete;
- export generation.

Mutation có thể không idempotent. Retry phải dựa vào backend idempotency contract.

## 17. Request Cancellation

Khi user thay search nhanh, đổi route hoặc đóng page, query layer nên tận dụng `AbortSignal` nếu service hỗ trợ.

Đặc biệt hữu ích cho search/filter list.

## 18. Pagination

Frontend không tự load toàn bộ record nếu backend đã pagination.

Contract cần chốt semantics:

```text
items
page
limit
total
totalPages
```

Không bắt buộc backend dùng đúng wrapper của dự án mẫu; ALSM phải theo contract NestJS thực tế.

## 19. API Versioning

Nếu backend chưa version route, không tự thêm `/v1` ở FE.

Nếu backend quyết định `/api/v1`, define ở base URL/config. Không duplicate version trong từng service.

## 20. Observability phía FE

Production build không log:

- access token;
- refresh token;
- password;
- OTP;
- source code;
- payment secrets;
- 2FA secret.

Có thể log development metadata có kiểm soát như endpoint, status, request id và domain error code.

## 21. Mock/API Switch

Trong giai đoạn FE-first:

```text
UI
→ service interface
→ mock adapter
```

Khi backend sẵn sàng:

```text
UI
→ same service interface
→ HTTP adapter
```

Không giữ song song hai business logic khác nhau.

Mock fallback phải có policy rõ và dễ tắt trước production/demo integration.

## 22. API Handoff Checklist

Mỗi endpoint khi BE bàn giao cần:

- method;
- path;
- auth requirement;
- organisation scope;
- role/permission;
- request DTO;
- response DTO;
- error codes;
- pagination;
- idempotency nếu mutation;
- upload limits nếu file;
- job status enum nếu async;
- example payload;
- Swagger/OpenAPI cập nhật.

FE không nên tự suy đoán field name khi contract chưa chốt.
