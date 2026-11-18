# Kế hoạch CI/CD riêng cho Backend và converter

Trạng thái: chỉ đề xuất, không có workflow auto deploy hoặc thay đổi máy chủ cho ba repo này. Chỉ triển khai giai đoạn này sau khi ba Frontend ổn định và baseline API không còn 502.

## Source đã đối chiếu với GitHub ngày 18/11/2026

| Repo | Branch | Head đã fetch |
| --- | --- | --- |
| ALSM_WEB_BE | develop | f9fdfc3 |
| ALSM_TOOL | main | 8d213f2 |
| ALSM_TOOL_BE | main | 31e4fcb |

Không mặc định image production `alsm-backend:converters-5273911` tương ứng các head trên; đây là tên image do người dùng cung cấp, chưa kiểm chứng được qua Docker do SSH timeout.

Dockerfile hiện tại của Backend chỉ dùng `node:22-bookworm-slim`, build NestJS, cài production npm dependencies, copy dist và chạy bằng user node. Nó **không đóng gói Python/Java/JAR/converter**. Workflow CI hiện chỉ kiểm tra image Node này; không đủ để chứng minh luồng conversion hoạt động khi thay image production.

Source Backend có BMS/DSPF adapter gọi `PYTHON_EXECUTABLE`, COBOL adapter gọi Java/JAR qua `JAVA_EXECUTABLE` và `TOOL2JAVA_JAR_PATH`. JAR có thể cần `Config.properties` cạnh JAR hoặc thư mục cha. Python repo có `py/convert2fe/test_bms2react.py` dùng unittest; Java converter có Maven và target Java 8, Spring Boot parent 2.3.5.RELEASE. Cần kiểm tra runtime Java thực tế và test tương thích, không tự nâng framework/runtime trong rollout CI/CD.

Backend đã gọi `enableShutdownHooks()`. `ConversionWorkerRunner.onModuleDestroy()` gọi `worker.close()` và đợi recovery; queue producer cũng close trong `onModuleDestroy`. Đây là cơ sở để thử graceful shutdown, **không phải bằng chứng** mọi job subprocess đều sống sót khi thay container. Worker concurrency mặc định 4, giới hạn 1–8, mỗi job có thể spawn JVM; cần tính RAM 8 GB cùng Redis/Node/Nginx.

Có `src/shared/startup/run-startup-seed.ts` và `src/modules/rbac/application/rbac-seed.service.ts`. Cần audit điều kiện chạy/giá trị mặc định và tác động trước khi rollout; không tự chạy chúng để kiểm thử.

## Pipeline build/kiểm thử

Mỗi repo chỉ build/test trên GitHub-hosted runner, không tiếp cận Atlas chung:

- Backend: Node 22, npm ci, lint, offline/unit tests, TypeScript, Nest build. Integration tests dùng MongoDB/Redis container dùng một lần trong CI, database giả riêng; không lấy `.env` production hoặc seed Atlas chung.
- Python: pin Python/dependencies, chạy unittest, kiểm tra BMS/DSPF bằng fixture đã công khai/được duyệt, snapshot cấu trúc output và smoke build React output. Không dùng dữ liệu nghiệp vụ thật.
- Java: pin JDK/Maven/dependencies tương thích, test/verify và reproducible JAR. Test converter + Config.properties bằng fixture COBOL/copybook, compile output Java, kiểm tra conversion report. Không chỉ dựa vào process exit 0 vì adapter hiện còn đọc trạng thái kết quả theo chương trình.
- Build image hợp nhất từ **ba full commit SHA** và dependency locks. Đóng gói Node/Python/Java/JAR/source converter; gắn labels commit/runtime/tool versions, SBOM và image digest. Scan image/dependencies, thử chạy nonroot với converter scratch volume riêng.
- Publish immutable image lên ECR bằng GitHub OIDC (không AWS key dài hạn). Deploy image bằng digest; cấm `latest` làm căn cứ rollback.

## Rollout có kiểm soát

1. Audit thực tế compose `/opt/alsm/deploy/compose.backend.yml`, volumes, restart policy, worker flags, upstream Nginx, Atlas allowlist và image đang chạy; chỉ đọc, không log credentials. Không thay image Node hiện có trước khi có image đầy đủ converters.
2. Giữ staging độc lập với Atlas production. Xác minh health/readiness, API auth bằng dữ liệu giả, Python/Java converter smoke tests và queue lifecycle.
3. Tách vai trò API và Conversion Worker thành hai service dùng cùng image/version. Đây là thay đổi kiến trúc cần một PR riêng và kiểm thử, không bật worker thứ hai vô tình.
4. Dừng nhận job mới ở worker cũ bằng một cơ chế pause/drain đã kiểm thử, theo dõi active count và lease generation; đợi job đang chạy hoàn tất với timeout phù hợp thời gian conversion tối đa. Không purge queue, không xóa Redis/volumes. Xác minh producer mới vẫn tương thích payload đang đợi.
5. Nếu triển khai API song song, bind bản ứng viên trên loopback/cổng riêng; không public port. Chỉ chuyển upstream sau readiness thành công. Không đồng thời chạy startup seed ở cả hai instance. Với RAM 8 GB, phải đo headroom trước khi chạy hai JVM workers/API image song song; nếu không đủ, dùng maintenance window có kế hoạch.
6. Roll worker từng bước sau drain; xác minh không mất/trùng kết quả, kiểm tra stalled/retry/lease và active jobs. Không đổi schema queue/payload cùng lúc với rollout hạ tầng nếu thiếu backward compatibility.
7. Quan sát health, error rate, queue depth/age, job success/failure và tài nguyên. Xác nhận AI Validation Worker vẫn tắt nếu chưa có yêu cầu riêng.

## Dữ liệu, seed và rollback

Migration phải là job quản trị riêng với approval, backup Atlas/PITR phù hợp và schema expand/contract tương thích image cũ. Startup không được tự migration hoặc seed/RBAC ghi đè. Audit seed idempotency và chạy trên database thử riêng trước khi xem xét production. Không đặt seed trong workflow deploy mặc định.

Lưu previous image **digest**, compose/config version không chứa secrets, và trạng thái worker flags. Nếu readiness/queue canary lỗi, khôi phục image/config đã xác minh. Rollback code không tự đảo ngược dữ liệu; nếu schema đã thay không tương thích thì không được tự rollback image để che lỗi. Không `docker compose down -v`, không xóa volumes, không đổi MongoDB Atlas database.

## Cập nhật converter độc lập

Ưu tiên phát hành converter artifacts/images theo SHA và contract version, rồi build một backend bundle tham chiếu digest cụ thể; một job phải ghi lại tool version/digest đã sử dụng. Không thay JAR hoặc thư mục Python bằng git pull trong lúc job đang chạy.

Giai đoạn sau có thể tách conversion engine thành worker image/service độc lập để API không phải restart theo converter. Cần protocol/versioned payload, khả năng drain, retry/idempotency, cancellation và storage contract trước khi tách. Rollback converter chỉ định digest trước đó cho **job mới**; job đang chạy tiếp tục dùng artifact đã pin. Chưa thực hiện thay đổi này.
