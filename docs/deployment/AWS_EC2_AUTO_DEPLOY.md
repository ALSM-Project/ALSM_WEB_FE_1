# ALSM — vận hành CI/CD Frontend trên EC2

Trạng thái ngày 18/11/2026 (Asia/Bangkok): **đang chuẩn bị, CHƯA bật auto deploy**. Ba PR phải giữ Draft cho tới khi hoàn tất kiểm thử EC2. Không coi kiểm thử sandbox là một lần deploy production thành công.

## Phạm vi và các PR

| Portal | Repository | PR | Nhánh |
| --- | --- | --- | --- |
| User | ALSM-Project/ALSM_WEB_FE_1 | https://github.com/ALSM-Project/ALSM_WEB_FE_1/pull/73 | feat/ci-aws-ec2-auto-deploy |
| Staff | ALSM-Project/ALSM_WEB_FE_2 | https://github.com/ALSM-Project/ALSM_WEB_FE_2/pull/80 | feat/ci-aws-ec2-auto-deploy |
| Web3 | ALSM-Project/ALSM_WEB_FE_3 | https://github.com/ALSM-Project/ALSM_WEB_FE_3/pull/2 | feat/ci-aws-ec2-auto-deploy |

Backend, MongoDB Atlas, Redis và converter không thuộc phạm vi triển khai. Không chạy migration, seed, đổi image, restart container, xóa volume hay mở thêm cổng Internet.

## Kết quả audit đã xác minh

- Tài khoản GitHub CLI: `hoanghuync`, có quyền admin cả ba repo và vai trò admin tổ chức. Token hiện tại chưa có `admin:org`; API runner group trả HTTP 403. Không có token nào được ghi vào repository.
- Ban đầu cả ba repo public đều chưa có runner, Actions Variables, Environment hoặc branch protection.
- Đã tạo Environment `production` chỉ nhận **branch** `develop`, không nhận tag trùng tên. Đã bảo vệ `develop`: CI `Build & Validate` phải đạt trên base mới nhất; ít nhất một approval; bỏ approval cũ khi push thêm; phải giải quyết conversation; áp dụng cả admin; cấm force push và xóa nhánh.
- Chưa thêm `Production build` làm required check vì Variables/HTTPS chưa sẵn sàng; tránh khóa các PR khác bởi một check chưa được cài trên develop. Sau khi workflow được đưa vào develop an toàn, thêm `Deployment safety tests` và `Production build` vào required checks.
- Người dùng xác nhận IP hiện tại: **52.64.192.103**, Sydney. HTTP tới IP mới trả 200. Chưa có quyền AWS API để xác nhận trạng thái Running bằng control plane.
- SSH tới `52.64.192.103:22` timeout từ IP quản trị quan sát được `171.231.177.7`. Không thay Security Group, không thêm host key không được xác minh.
- DNS các tên `*.3-27-190-25.sslip.io` cố định theo IP cũ. Không dùng chúng làm cấu hình deploy mới.
- Kiểm tra chẩn đoán bằng `curl --resolve <hostname-cũ>:443:52.64.192.103`: ba giao diện trả 200 và TLS hợp lệ; cả ba `/api/v1/health` trả **502 Bad Gateway**. Phép đo này không thay DNS và không chứng minh người dùng Internet truy cập được qua domain cũ.
- `https://user.52-64-192-103.sslip.io`, `https://staff.52-64-192-103.sslip.io`, `https://web3.52-64-192-103.sslip.io` đều chưa có chứng chỉ khớp tên. Không tắt xác minh TLS và chưa đưa các URL này vào Variables.
- Do SSH bị chặn, Nginx config, Docker/Redis, quyền thư mục, image đang chạy và trạng thái worker trên máy chủ **chưa được kiểm tra trực tiếp**. Chưa có thay đổi nào được thực hiện trên EC2.

## Kiến trúc workflow

`.github/workflows/ci.yml` hiện có được giữ nguyên. Nó chỉ build/test, không deploy, nên không tranh ghi website với workflow mới.

Workflow `deploy-ec2.yml` chạy kiểm thử trên GitHub-hosted Ubuntu 24.04/Node 22 khi PR tới develop hoặc push develop. Các commit mới của PR Draft vẫn được kiểm thử. Chỉ push/dispatch trên `refs/heads/develop` của đúng repository mới được vào job deploy. Dispatch trên nhánh khác và mọi PR đều không được vào EC2. Trigger push nhánh chuẩn bị dùng trong lần kiểm tra đầu đã được bỏ để tránh chạy trùng với pull_request.

1. Kiểm tra YAML/expressions bằng actionlint có checksum; kiểm thử deploy/rollback trong thư mục tạm.
2. `npm ci`, lint, **test cả ba repo**, `tsc -b`, kiểm tra URL production, Vite production build.
3. Tạo `_alsm/release.json`: portal, commit, ba origins và SHA256 của từng file. Chặn symlink, đường dẫn xuyên thư mục, file ẩn và các loại private key trong artifact.
4. Upload artifact immutable, download bằng artifact ID của cùng run. Pin mọi Action tới full commit SHA đã đối chiếu với official release.
5. Runner không checkout code, không chạy npm và không thực thi script trong artifact. Nó chỉ gọi deployer đã được admin cài vào `/usr/local/lib/alsm-deploy/deploy.py`; SHA256 của deployer phải khớp code đã kiểm thử trên hosted runner.
6. Khóa `flock` riêng portal; xác minh toàn bộ artifact và origins khớp cấu hình root-owned; publish theo full commit SHA. Không ghi đè SHA đã tồn tại, kể cả rerun.
7. Chuyển `current` bằng `os.replace` atomic. Kiểm tra HTTPS marker, index, JS/CSS và API health `status=ok`; không chỉ kiểm tra HTTP 200.
8. Lỗi/TERM/INT khôi phục link trước và kiểm tra HTTPS lại. Journal được timer độc lập kiểm tra mỗi 30 giây để phục hồi sau SIGKILL/power loss. Không thể bảo đảm truy cập trong thời gian EC2/nginx/mạng ngừng hoạt động.
9. Giữ năm release gần nhất, thêm current/previous/initial nếu cần. Backup gốc không bị dọn. Staging bỏ dở được dọn sau một ngày khi có lần deploy thành công; cần giám sát disk vì còn có work/cache của runner.

## Kết quả GitHub Actions đã quan sát

- FE1: [run 44311798056](https://github.com/ALSM-Project/ALSM_WEB_FE_1/actions/runs/44311798056) đạt actionlint, 14 sandbox deployment tests và một test Linux atomic bootstrap; lint/test/TypeScript đạt. Production URL validation thất bại đúng thiết kế vì Variables chưa được cấu hình; không tạo artifact production và không deploy.
- FE3: [run 44311830797](https://github.com/ALSM-Project/ALSM_WEB_FE_3/actions/runs/44311830797) đạt actionlint, 14 sandbox deployment tests, lint/test/TypeScript; bị chặn ở URL validation tương tự.
- FE2: [run chẩn đoán 44309646664](https://github.com/ALSM-Project/ALSM_WEB_FE_2/actions/runs/44309646664) đã ghi nhận ít nhất 14 test lỗi trong sáu file bên dưới, rồi không kết thúc. Run commit cũ đã được hủy sau khi lấy đủ bằng chứng để nhường runner hosted cho commit mới. Safety tests đạt. CI cũ FE2 đạt vì chỉ lint/typecheck/build, không gọi test; kết quả xanh của CI cũ không chứng minh đủ điều kiện deploy.

Các tệp test FE2 có lỗi: `DatabaseDrivenNavigationPermissions.test.tsx` (2), `LeadDetailPage.test.tsx` (5), `UploadSourceFilesPage.test.tsx` (1), `ConversionItemReviewPage.test.tsx` (2), `PartnerProjectWorkspacePage.test.tsx` (3), `CreatePartnerProjectModal.test.tsx` (1). Không sửa nghiệp vụ, fixtures hoặc bỏ test trong PR hạ tầng. Bước test FE2 dùng `npm run test -- --bail=1` và timeout 10 phút để trả lỗi sớm; khi hết lỗi thì toàn bộ suite vẫn phải chạy qua. Cần nhóm FE2 sửa/xác nhận các lỗi và hiện tượng treo trong một thay đổi được review riêng trước khi bật deploy.

Đây là kiểm thử GitHub-hosted thật, **chưa có lần deploy GitHub Actions lên EC2**, chưa có artifact production đúng URL và chưa kiểm thử rollback trên EC2. Luôn xem run của HEAD mới nhất trong PR; không dùng run cũ làm căn cứ merge.

Artifact tối đa 250 MiB/10.000 file; artifact GitHub giữ 7 ngày. Đổi deployer cần admin cập nhật bản cài trên EC2 trước khi workflow mới deploy; mismatch sẽ dừng trước khi tải artifact.

## Biến build đã đối chiếu source

Cả ba repo cần các repository Actions Variables `ALSM_USER_URL`, `ALSM_STAFF_URL`, `ALSM_WEB3_URL`, chỉ đặt sau khi public DNS/TLS và API hoạt động. Không commit `.env.production`. Không có URL mặc định dùng để báo deploy thành công.

| Repo | Ánh xạ Vite |
| --- | --- |
| FE1 | `VITE_API_BASE_URL=ALSM_USER_URL`; staff/web3 portal URLs tương ứng |
| FE2 | `VITE_API_BASE_URL=ALSM_STAFF_URL`; `VITE_USER_PORTAL_URL` và **`VITE_CONVERSION_WORKSPACE_URL`** = ALSM_USER_URL; mock support false; local-only support HTTP trống |
| FE3 | `VITE_API_BASE_URL` và **`VITE_API_URL`** = ALSM_WEB3_URL; user/staff/web3 portal URLs tương ứng |

FE1/FE3 còn đọc `VITE_API_TIMEOUT_MS`, mặc định 30000 ms. `VITE_GOOGLE_CLIENT_ID` lấy từ `ALSM_GOOGLE_CLIENT_ID` nếu có giá trị thật đã xác minh. Ví dụ trong source chưa đủ để xác nhận cấu hình OAuth production; không sao chép bừa vào Variables. Mọi `VITE_*` đều công khai trong bundle.

## Việc cần thực hiện trên Ubuntu trước

Có thể cho phép SSH **chỉ IP quản trị hiện tại `/32`** sau khi xác minh lại IP egress; không mở `0.0.0.0/0`. Nếu không cho phép SSH, quản trị viên chạy script đã review bằng phiên Ubuntu hiện có:

```bash
bash .github/deployment/audit-ec2.sh
```

Script chỉ đọc metadata public, service/container status, quyền thư mục, Nginx, SAN/ngày hạn của certificate, cổng lắng nghe và health; không đọc `.env`, private key hay Docker environment. Đối chiếu output trước khi cài đặt. Không đặt tên thư mục chứa script trùng `/opt/alsm` nếu ảnh hưởng quyền Backend.

**Dừng tại đây khi API vẫn 502.** Quản trị viên cần xác định nguyên nhân upstream riêng. Bộ công cụ frontend không khởi động lại/sửa Backend để vượt qua điều kiện này.

Sau khi audit Nginx, cần một phương án URL được duyệt: domain ổn định đang sở hữu hoặc tên sslip theo IP mới. Nếu thêm tên mới, sao lưu cấu hình, thêm server_name/HTTP challenge tương ứng, cấp certificate mới với tên riêng để giữ nguyên certificate cũ, chạy `nginx -t`, rồi reload có kiểm soát. Chỉ làm sau khi biết config thật và có phương án khôi phục config/certificate. Chưa có thao tác TLS/DNS nào được thực hiện trong lần chuẩn bị này.

## Chuẩn bị release — chỉ sau khi baseline khỏe

Review toàn bộ `.github/deployment/bootstrap.py`. Nó yêu cầu root, ba URL hợp lệ, nginx/docker active, HTTP body đúng build local và API HTTPS khỏe cho cả ba site trước khi thay website.

```bash
# Cài chỉ khi thiếu; không upgrade toàn hệ thống hoặc restart dịch vụ Backend.
sudo env NEEDRESTART_MODE=l apt-get install -y --no-upgrade rsync curl python3
# Ba giá trị này phải là origins đã xác minh, không dùng domain đang lỗi chứng chỉ.
sudo python3 .github/deployment/bootstrap.py \
  --user-url "$ALSM_USER_URL" --staff-url "$ALSM_STAFF_URL" --web3-url "$ALSM_WEB3_URL"
```

Bootstrap tạo account `alsmrunner` không sudo/docker, home `/var/lib/alsmrunner`, snapshot `initial`, link `current`, backup root-only `/var/www/alsm/.backups/<portal>.before-cicd`, và cấu hình root-owned `/etc/alsm-deploy/portals.json`. Linux `renameat2(RENAME_EXCHANGE)` đổi directory và symlink trong một thao tác, tránh cửa sổ thư mục root bị mất. Nếu HTTPS sau đổi lỗi, script đổi ngược lại ngay. Các backup có sẵn không bị ghi đè. Trạng thái setup dở bất thường sẽ dừng để kiểm tra thay vì xóa dữ liệu.

Nginx root vẫn là `/var/www/alsm/user|staff|web3`, trỏ tới `releases/<portal>/current`. Không sửa Nginx/certificate hoặc reload Nginx bởi bootstrap. Deployer và recovery service chỉ ghi cây releases; account không đọc được backup gốc. Recovery timer độc lập runner tự khởi động sau boot.

## Runner và public repository

GitHub cảnh báo self-hosted runner trong public repo có thể bị workflow PR chiếm quyền. Label và `if` trong một workflow **không phải** ranh giới truy cập: người tạo PR có thể thêm workflow khác. Không cài repo-level production runner chỉ để vượt lỗi quyền quản trị tổ chức.

Điều kiện bắt buộc của runner group `alsm-frontend-production`:

- `visibility=selected`, chỉ ba repository IDs: FE1 `1330979095`, FE2 `1360316550`, FE3 `1451449741`.
- `allows_public_repositories=true` chỉ trong group đã giới hạn này.
- `restricted_to_workflows=true`, chính xác ba workflow:
  - `ALSM-Project/ALSM_WEB_FE_1/.github/workflows/deploy-ec2.yml@refs/heads/develop`
  - `ALSM-Project/ALSM_WEB_FE_2/.github/workflows/deploy-ec2.yml@refs/heads/develop`
  - `ALSM-Project/ALSM_WEB_FE_3/.github/workflows/deploy-ec2.yml@refs/heads/develop`
- Xác minh API trả đúng toàn bộ giới hạn; nếu plan/API không hỗ trợ giới hạn workflow, **không đăng ký runner production**, dùng phương án SSM bên dưới.

Cấp quyền CLI chính thức bằng `gh auth refresh -h github.com -s admin:org` nếu người quản trị lựa chọn. Một lựa chọn ít quyền hơn là fine-grained token chỉ có quyền quản lý organization self-hosted runners cần thiết; không yêu cầu quyền repo/backend/credentials khác. Không đưa token vào chat hoặc log.

`install-runner.sh` dùng official runner v2.338.2, kiểm SHA256, nhận official registration token ngắn hạn trên stdin, không in token. Chỉ chạy sau khi group được kiểm tra. Chuyển token từ `gh api orgs/ALSM-Project/actions/runners/registration-token` qua một kênh SSH đã xác thực; không truyền trong command line hay file repository. Không dùng lệnh `echo` chứa token trong terminal history.

Installer tạo root-owned systemd unit, chạy `runsvc.sh` bằng alsmrunner, không chạy file do runner sở hữu với quyền root. `runner-hardening.conf` chặn ghi toàn hệ thống ngoài runner home/releases; ẩn `/opt/alsm`, Docker socket và certificate private; chặn loopback, private networks và IMDS. Phải kiểm tra systemd áp dụng IP filtering và xác nhận runner không truy cập Backend/Redis/IMDS được trước khi cho nhận job. Runner vẫn có quyền thay đổi cả ba Frontend; review quyền push và workflow là điều kiện vận hành bắt buộc.

Xác nhận service tự khởi động, GitHub hiển thị Online/Idle và label `alsm-deploy`. Runner tự cập nhật theo cơ chế chính thức; kiểm tra lại service sau update. Không để token đăng ký tồn tại lâu hơn cần thiết. Chưa có runner nào được đăng ký ở thời điểm audit.

Tài liệu gốc: [runner groups](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/manage-access), [runner group API](https://docs.github.com/en/rest/actions/self-hosted-runner-groups).

## Phương án SSM khi không dùng được workflow-restricted group

Giữ toàn bộ build trên GitHub-hosted runner. Dùng GitHub OIDC với IAM role riêng từng portal, trust giới hạn đúng repo + environment production; Environment chỉ cho branch develop. Không lưu AWS access key.

Upload artifact/manifest vào S3 private prefix riêng portal (block public access, encryption, lifecycle). Role chỉ được ghi prefix đó và gọi `ssm:SendCommand` tới đúng instance bằng **custom SSM document cố định**; không cấp `AWS-RunShellScript` tùy ý. Document chỉ nhận portal/commit/object identity đã validate, gọi deployer root-owned dưới account alsmrunner, không cho truyền shell script. Instance role chỉ đọc các prefix artifact; agent/document cần được audit. Giữ manifest digest, release lock, atomic switch, HTTPS verification và rollback như thiết kế hiện tại.

SSM không cần mở SSH inbound. Cần quyền AWS/IAM để triển khai phương án này và kiểm tra SSM agent; chưa được cấu hình. [AWS Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html).

## Kiểm thử và điều kiện merge

1. Actionlint, sandbox rollback/isolation, lint, toàn bộ test, TypeScript, production build phải thành công trên commit chuẩn bị mới nhất.
2. Cả ba URL public truy cập HTTPS hợp lệ và `/api/v1/health` healthy trước deploy; config root-owned khớp Variables.
3. Bootstrap, account permissions, runner group restrictions, service và Online/Idle được kiểm tra thực tế.
4. Kiểm thử lỗi trên cây release tạm của Ubuntu bằng `python3 .github/deployment/test_deploy.py` và test bootstrap; không bẻ health/đổi link production để giả lập lỗi cho người dùng.
5. Chỉ sau các điều kiện trên và approval của reviewer mới merge một PR được kiểm soát; push develop kích hoạt deploy. Các PR vẫn Draft cho tới lúc đó. Không force push develop.
6. Ghi run URL, artifact ID/digest, current target, marker commit, HTTPS cả ba site, Backend health trước/sau. Xác minh hai current links còn lại không đổi.
7. Sau deploy thành công đầu tiên, bật thêm hai required checks mới trên develop. Lặp lại cho hai portal còn lại.

`workflow_dispatch` trên branch chuẩn bị chỉ kiểm thử hosted CI, không deploy; workflow phải hiện diện trên default branch theo cơ chế GitHub để dùng nút Run workflow. Không đổi guard hay cấp runner cho branch PR để lách điều kiện kiểm thử.

## Rollback sau khi đã cài đặt

Trên Ubuntu, admin có thể gọi cùng deployer với quyền runner, nhận cùng lock và kiểm tra HTTPS:

```bash
sudo -u alsmrunner python3 /usr/local/lib/alsm-deploy/deploy.py rollback \
  --portal user --revision initial
# Hoặc --revision là full SHA của release tốt còn được giữ lại.
```

Chọn đúng user/staff/web3. Không dùng rsync --delete vào current; không sửa nội dung release theo SHA; không đổi các portal khác. Rollback bình thường yêu cầu baseline và bản mục tiêu phục vụ khỏe. Khi API/mạng đang hỏng khiến kiểm tra baseline không đạt, admin phải đánh giá khôi phục hạ tầng trước; công cụ không báo rollback thành công khi health còn lỗi.

Nếu runner bị kill giữa giao dịch, `alsm-deploy-recovery.timer` đọc journal, khôi phục trước đó và kiểm tra lại; xem `journalctl -u alsm-deploy-recovery.service` bằng tài khoản admin. Nếu health không hồi phục, journal được giữ để cảnh báo/kiểm tra lại. Backup root-only vẫn giữ nguyên để admin phục hồi thủ công nếu cần.

## Danh sách file

Cả ba repo: `.github/workflows/deploy-ec2.yml`, `.github/actionlint.yaml`, `.github/deployment/.gitattributes`, `.github/deployment/deploy.py`, `.github/deployment/test_deploy.py`.

Riêng FE1: `.github/deployment/audit-ec2.sh`, `bootstrap.py`, `test_bootstrap.py`, `install-runner.sh`, `runner-hardening.conf`; tài liệu này và `BACKEND_CICD_PLAN.md`. Không sửa code nghiệp vụ hoặc workflow CI cũ.
