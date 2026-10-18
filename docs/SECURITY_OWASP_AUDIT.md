# BÁO CÁO RÀ SOÁT BẢO MẬT & TỐI ƯU HIỆU NĂNG (OWASP TOP 10 AUDIT)
**Hệ thống Quản lý KPI & Đánh giá Cán bộ**

---

## 1. RÀ SOÁT BẢO MẬT OWASP TOP 10

| STT | Danh mục Lỗ hổng (OWASP Top 10) | Biện pháp & Kiểm soát Kỹ thuật đã áp dụng trong Hệ thống | Trạng thái |
|:---|:---|:---|:---:|
| **A01** | **Broken Access Control & IDOR** | - Triển khai `DataScopeGuard` kiểm soát theo 4 cấp bậc: `ALL`, `DEPARTMENT_AND_CHILDREN`, `DEPARTMENT_ONLY`, `SELF_ONLY`.<br>- Mọi truy vấn theo `targetUserId` hoặc `targetDepartmentId` đều được so khớp quyền và cây phân cấp path-based (`/root/dept-01/...`).<br>- Chặn triệt để nguy cơ trích xuất số liệu chéo đơn vị trái phép. | **ĐẠT** |
| **A02** | **Cryptographic Failures** | - Mật khẩu người dùng được băm bằng thuật toán `bcrypt` với muối `salt = 10`.<br>- Secret 2FA và Access Token được mã hóa chuẩn JWT RS256/HS256 với thời hạn hết hạn nghiêm ngặt.<br>- Kết nối qua HTTPS/TLS và Nginx SSL termination. | **ĐẠT** |
| **A03** | **Injection (SQL, NoSQL, Command)** | - Sử dụng ORM **Prisma** với cơ chế Parameterized Queries 100%, loại trừ hoàn toàn nguy cơ SQL Injection dạng chuỗi.<br>- NestJS `ValidationPipe` tự động whitelist và strip out các thuộc tính lạ (`whitelist: true`). | **ĐẠT** |
| **A04** | **Insecure Design** | - Quy trình nghiệp vụ kiểm tra State Machine nghiêm ngặt (`WorkflowStateMachineService`).<br>- Khóa kỳ đánh giá bất biến sau khi công bố (`LOCKED`).<br>- Mọi điều chỉnh điểm số của lãnh đạo bắt buộc nhập lý do giải trình $\ge 10$ ký tự và lưu vết vĩnh viễn trong Audit Log. | **ĐẠT** |
| **A05** | **Security Misconfiguration** | - Cấu hình Nginx với các HTTP Security Headers chuẩn OWASP:<br>  * `X-Frame-Options: SAMEORIGIN`<br>  * `X-Content-Type-Options: nosniff`<br>  * `X-XSS-Protection: 1; mode=block`<br>  * `Content-Security-Policy`<br>- Đặt môi trường `NODE_ENV=production` trong Docker. | **ĐẠT** |
| **A06** | **Vulnerable and Outdated Components** | - Toàn bộ các gói thư viện được quét và kiểm tra không có lỗ hổng bảo mật nghiêm trọng (Prisma 6.4, NestJS 11, React 19). | **ĐẠT** |
| **A07** | **Identification & Authentication Failures** | - Xác thực 2 yếu tố (2FA TOTP) với mã QR chuẩn Google Authenticator.<br>- Cơ chế Refresh Token xoay vòng (Rotation) tự động hủy phiên khi phát hiện đăng nhập bất thường. | **ĐẠT** |
| **A08** | **Software and Data Integrity Failures** | - Các tệp backup cơ sở dữ liệu được mã hóa nén và tạo mã băm SHA-256 (`scripts/backup.sh`) kèm kiểm tra tính toàn vẹn khi phục hồi (`scripts/restore.sh`). | **ĐẠT** |
| **A09** | **Security Logging and Monitoring Failures** | - Middleware `AuditLog` tự động ghi nhận mọi thao tác CREATE, UPDATE, DELETE kèm IP Address, User Agent và thời gian thực. | **ĐẠT** |
| **A10** | **Server-Side Request Forgery (SSRF)** | - Giới hạn phạm vi kết nối MinIO và Webhook chỉ trong dải mạng nội bộ Docker (`kpi_network`). | **ĐẠT** |

---

## 2. TỐI ƯU HIỆU NĂNG & TẢI TRỌNG HỆ THỐNG

1. **Đánh chỉ mục Cơ sở dữ liệu (Database Indexing):**
   - Đánh chỉ mục B-Tree trên các trường truy vấn tần suất cao:
     - `departments(parentId)`, `departments(path)`
     - `users(employeeCode)`, `users(username)`, `users(email)`, `users(departmentId)`
     - `evaluation_records(userId)`, `evaluation_records(periodId)`, `evaluation_records(status)`
2. **Bộ nhớ đệm (Caching & In-Memory):**
   - Tích hợp Redis 7 lưu trữ session, danh mục cây đơn vị và kết quả tổng hợp báo cáo.
3. **Nén & Tối ưu Băng thông (Gzip & CDN Assets):**
   - Cấu hình Nginx nén gzip toàn bộ phản hồi JSON, JS, CSS trên 10KB.
   - Cache-Control `immutable` 6 tháng cho các tệp tĩnh hash (js/css).
