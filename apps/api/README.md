# KPI & Civil Servant Performance Assessment REST API

Hệ thống REST API được xây dựng bằng **NestJS + TypeScript**, phục vụ **Hai chế độ hoạt động trên một lõi kiến trúc**:
1. **Chế độ Doanh nghiệp**: KPI / OKR / BSC, đánh giá 360 độ, tính điểm trọng số và gắn thưởng hiệu suất.
2. **Chế độ Cơ quan Nhà nước**: Đánh giá, xếp loại chất lượng cán bộ, công chức, viên chức theo **Nghị định 90/2020/NĐ-CP** và **Nghị định 48/2023/NĐ-CP** (khống chế tỷ lệ Hoàn thành xuất sắc nhiệm vụ <= 20% mức Tốt).

---

## 🏗️ Kiến trúc & Nguyên tắc cốt lõi

- **RBAC + Data Scope**: Phân quyền theo chức danh (`RoleType`) kết hợp phạm vi truy cập dữ liệu theo cây tổ chức (`DataScopeType`):
  - `ALL`: Toàn quyền hệ thống (Lãnh đạo cơ quan, Admin).
  - `DEPARTMENT_AND_CHILDREN`: Đơn vị và toàn bộ các phòng ban cấp con trực thuộc (Trưởng đơn vị).
  - `DEPARTMENT_ONLY`: Chỉ trong phạm vi phòng ban công tác.
  - `SELF_ONLY`: Chỉ dữ liệu của bản thân cán bộ.
- **Audit Log Bất biến**: Mọi thao tác thêm/sửa/xóa hoặc các hành động nhạy cảm đều được ghi vết (`AuditAction`, `oldValues`, `newValues`, `reason`, `ipAddress`, `userAgent`).
- **Khóa kỳ (Period Locking)**: Khi kỳ đánh giá đã khóa (`LOCKED`), mọi bản ghi đều ở trạng thái chỉ đọc (`isLocked = true`). Muốn mở khóa phải có quyền đặc biệt (`SUPER_ADMIN`, `HEAD_OF_AGENCY`) và bắt buộc nhập lý do có căn cứ kiểm toán.

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Khởi động Hạ tầng Docker (PostgreSQL 16, Redis 7, MinIO S3)
```bash
# Khởi chạy các container nền
docker compose -f docker/docker-compose.yml up -d
```

### 2. Sinh Prisma Client & Đồng bộ CSDL
```bash
# Sinh client
npm run db:generate

# Chạy migration
npm run db:migrate

# Nạp dữ liệu mẫu tiếng Việt chuẩn quy chuẩn
npm run db:seed
```

### 3. Chạy API Server ở chế độ Development
```bash
npm run api:dev
```
- Đường dẫn API: `http://localhost:4000/api/v1`
- Tài liệu OpenAPI Swagger: `http://localhost:4000/api/v1/docs`

### 4. Chạy Bộ Unit Test
```bash
npm run api:test
```

---

## 🔑 Tài khoản mẫu khởi tạo (Seed Accounts)

| Vai trò | Tên đăng nhập | Mật khẩu mặc định | Data Scope |
| :--- | :--- | :--- | :--- |
| **Người đứng đầu Cơ quan** | `lanhdao.an` | `MatKhau@2026!` | `ALL` |
| **Trưởng phòng Chuyên môn** | `truongphong.minh` | `MatKhau@2026!` | `DEPARTMENT_AND_CHILDREN` |
| **Chuyên viên chính** | `chuyenvien.thang` | `MatKhau@2026!` | `SELF_ONLY` |
| **Chuyên viên / Đồng nghiệp** | `chuyenvien.mai` | `MatKhau@2026!` | `SELF_ONLY` |
