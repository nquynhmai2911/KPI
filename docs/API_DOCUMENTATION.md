# TÀI LIỆU KỸ THUẬT API (REST API SPECIFICATION)
**Hệ thống Quản lý KPI & Đánh giá Cán bộ (Dual-Mode)**
**Base URL:** `http://localhost:4000/api/v1`
**Swagger UI:** `http://localhost:4000/api/v1/docs`

---

## 1. XÁC THỰC & PHÂN QUYỀN (AUTHENTICATION & RBAC)

Mọi yêu cầu gọi API (trừ đăng nhập và làm mới token) đều bắt buộc gửi kèm Access Token qua HTTP Header:
```http
Authorization: Bearer <jwt_access_token>
```

### 1.1. Đăng nhập hệ thống
- **Endpoint:** `POST /auth/login`
- **Request Body:**
```json
{
  "username": "superadmin",
  "password": "Password2026!"
}
```
- **Response 200 OK:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
  "refreshToken": "d7a8e2b1-9c3f-4e01-...",
  "user": {
    "id": "usr-001",
    "username": "superadmin",
    "fullName": "Nguyễn Văn An",
    "roles": ["SUPER_ADMIN"],
    "dataScope": "ALL",
    "departmentId": "dept-01"
  }
}
```

### 1.2. Xác thực 2 bước (2FA TOTP)
- **Kích hoạt 2FA:** `POST /auth/2fa/generate` $\to$ Trả về QR Code Data URL và secret key.
- **Xác thực OTP:** `POST /auth/2fa/verify` $\to$ Body: `{"token": "123456"}`.

---

## 2. THIẾT LẬP KỲ & CHỈ TIÊU KPI (PHASE 2 API)

### 2.1. Quản lý Kỳ đánh giá
- **Danh sách kỳ:** `GET /periods?status=IN_PROGRESS`
- **Tạo kỳ mới:** `POST /periods`
  - Body:
    ```json
    {
      "name": "Đánh giá KPI Quý IV/2026",
      "code": "PERIOD_2026_Q4",
      "type": "QUARTERLY",
      "startDate": "2026-10-01T00:00:00Z",
      "endDate": "2026-12-31T23:59:59Z",
      "operatingMode": "HYBRID"
    }
    ```
- **Khóa kỳ:** `POST /periods/:id/lock` $\to$ Ngăn chặn chỉnh sửa dữ liệu của kỳ.

### 2.2. Giao & Phân bổ KPI
- **Giao KPI cho nhân viên:** `POST /kpis/assign`
- **Xác nhận KPI:** `PATCH /kpis/assignments/:id/accept`
- **Yêu cầu phản hồi:** `PATCH /kpis/assignments/:id/feedback`
- **Engine tính điểm:** `POST /kpis/calculate-score`

---

## 3. THEO DÕI TIẾN ĐỘ & CHECK-IN (PHASE 3 API)

### 3.1. Cập nhật tiến độ & Minh chứng
- **Cập nhật số liệu thực tế:** `POST /tracking/checkin`
  - Body:
    ```json
    {
      "assignmentId": "asg-001",
      "actualValue": 88.5,
      "note": "Đã giải quyết 88/100 hồ sơ hành chính đúng hạn",
      "attachments": [
        {
          "fileName": "bien_ban_nghiem_thu.pdf",
          "fileUrl": "https://s3.kpi.gov.vn/evidence/asg-001/doc1.pdf",
          "fileSize": 1048576,
          "mimeType": "application/pdf"
        }
      ]
    }
    ```
- **Xác nhận số liệu (Quản lý):** `PATCH /tracking/checkin/:id/verify`
  - Body: `{"status": "CONFIRMED", "comment": "Số liệu chính xác theo báo cáo văn phòng"}`

### 3.2. Check-in 1:1
- **Tạo cuộc họp 1:1:** `POST /tracking/1on1`
  - Body:
    ```json
    {
      "employeeId": "usr-emp-002",
      "scheduledDate": "2026-10-25T09:00:00Z",
      "topics": "Đánh giá tiến độ số hóa dữ liệu và tháo gỡ vướng mắc nhân sự",
      "actionItems": "Phối hợp với Sở TT&TT để nâng cấp đường truyền trước ngày 30/10"
    }
    ```

### 3.3. Job nền & Cảnh báo nguy cơ
- **Quét cảnh báo tiến độ:** `POST /tracking/scheduler/scan-risk`
  - Tự động phát hiện các KPI có tiến độ $< 70\%$ so với mục tiêu và gửi thông báo in-app / email.

---

## 4. QUY TRÌNH ĐÁNH GIÁ & STATE MACHINE (PHASE 4 API)

### 4.1. Chuyển trạng thái quy trình
- **Endpoint:** `POST /evaluation/transition`
- **Request Body:**
```json
{
  "recordId": "rec-eval-001",
  "currentStatus": "SELF_EVALUATED",
  "nextStatus": "COLLECTIVE_REVIEW",
  "operatingMode": "GOVERNMENT"
}
```

### 4.2. Ghi nhận Biên bản Hội nghị tập thể
- **Endpoint:** `POST /evaluation/collective-review`
- **Request Body:**
```json
{
  "recordId": "rec-eval-001",
  "meetingDate": "2026-10-20T14:30:00Z",
  "attendees": ["Đ/c Nguyễn Văn An", "Đ/c Lê Hoàng Minh", "Đ/c Trần Thị Mai"],
  "totalVotes": 15,
  "votesExcellent": 14,
  "votesGood": 1,
  "concludingRemarks": "Tập thể đơn vị thống nhất đề nghị xếp loại Hoàn thành xuất sắc nhiệm vụ"
}
```

### 4.3. Điều chỉnh điểm và Giải trình kiểm toán
- **Endpoint:** `POST /evaluation/adjust-score`
- **Request Body:**
```json
{
  "recordId": "rec-eval-001",
  "originalScore": 86.0,
  "adjustedScore": 92.5,
  "adjustedClassification": "HOAN_THANH_XUAT_SAC",
  "reason": "Cán bộ có sáng kiến cấp tỉnh được công nhận theo Quyết định số 412/QĐ-UBND"
}
```

---

## 5. BÁO CÁO & XUẤT DỮ LIỆU (PHASE 5 API)

### 5.1. Báo cáo tổng hợp đơn vị
- **Endpoint:** `GET /reports/summary?departmentId=dept-01&periodId=period-001`
- **Xuất Excel:** `GET /reports/export/excel?periodId=period-001`
- **Xuất PDF Mẫu số 01 (Nghị định 90):** `GET /reports/export/form-01?userId=usr-001&periodId=period-001`

### 5.2. Module Lương thưởng KPI Doanh nghiệp
- **Endpoint:** `GET /reports/kpi-salary?periodId=period-001`
- **Công thức:** $\text{Lương KPI} = \text{Lương cơ bản} \times K_{KPI}$
  - Mức A (Xuất sắc): $K = 1.5$
  - Mức B (Tốt): $K = 1.2$
  - Mức C (Hoàn thành): $K = 1.0$
  - Mức D (Không hoàn thành): $K = 0.0$

### 5.3. Danh sách Quy hoạch & Khen thưởng Nhà nước
- **Endpoint:** `GET /reports/career-planning?year=2026`
- **Danh sách đề xuất:** Nâng ngạch, nâng lương trước hạn 12 tháng (áp dụng cho cán bộ đạt 2 năm liên tiếp Hoàn thành xuất sắc nhiệm vụ theo Thông tư 08/2013/TT-BNV).
