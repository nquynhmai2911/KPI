# TÀI LIỆU CHUẨN HÓA PHÂN QUYỀN (RBAC & DATA SCOPE MATRIX)
## Hệ Thống Quản Lý KPI & Đánh Giá Hiệu Quả Công Việc (KPI OS)
*Phiên bản: 1.5 - Chuẩn hóa RBAC, Data Scopes, Separation of Duties (SoD) & Dynamic Roles*

---

## 1. TỔNG QUAN KIẾN TRÚC PHÂN QUYỀN

Hệ thống được thiết kế theo mô hình **RBAC (Role-Based Access Control) kết hợp Data Scope (Phạm vi dữ liệu) đa chiều**, giải quyết đồng thời hai bài toán:
- **Doanh nghiệp**: Đánh giá đa chiều 360°, BSC/KPI/OKR, ma trận phòng ban, gắn lương thưởng.
- **Cơ quan Nhà nước**: Đánh giá, xếp loại cán bộ, công chức, viên chức theo **Nghị định 90/2020/NĐ-CP** và **Nghị định 48/2023/NĐ-CP** (Hội đồng, Thư ký, Người đứng đầu, phân cấp quản lý đơn vị).

### Các nguyên tắc nền tảng:
1. **Multi-Role User**: Một tài khoản có thể được gán nhiều vai trò cùng lúc (ví dụ: vừa là `UNIT_HEAD`, vừa là `COUNCIL_MEMBER`).
2. **Active Role Switching**: Người dùng có thể chuyển đổi vai trò đang làm việc ngay trên thanh Header mà không cần đăng xuất. Toàn bộ Menu bên trái, Dashboard trung tâm, bộ lọc dữ liệu và quyền hạn sẽ tự động chuyển đổi tương ứng theo vai trò đang chọn.
3. **Query-Level Data Scope Enforcement (Chống IDOR)**: Không chỉ ẩn/hiện nút ở giao diện frontend, toàn bộ câu truy vấn backend (SQL/Prisma/Service) đều áp đặt điều kiện WHERE theo phạm vi dữ liệu đã phân bổ của role.
4. **Cưỡng chế Tách quyền ở Backend (Separation of Duties - SoD)**: Các quy tắc chống xung đột lợi ích, bảo vệ bí mật điểm số cá nhân và toàn vẹn kỳ khóa được kiểm tra tự động tại tầng dịch vụ nghiệp vụ.
5. **Cấu hình động không cần sửa Code**: Cho phép bật/tắt vai trò (`isActive: boolean`), gán lại permission cho role, hoặc sao chép vai trò (`cloneRole`) trực tiếp trên giao diện Quản trị Ma trận quyền.

---

## 2. DANH MỤC 10 VAI TRÒ CHUẨN HÓA (SYSTEM ROLES)

| STT | Mã Vai Trò (Role Code) | Tên Vai Trò Nghiệp Vụ | Phạm Vi Dữ Liệu Mặc Định | Mô Tả Trách Nhiệm Chính |
|---|---|---|---|---|
| 1 | `SYSTEM_ADMIN` | Quản trị viên Kỹ thuật | `ALL` (Chỉ dữ liệu hạ tầng) | Quản trị tài khoản, phân quyền RBAC, cấu hình SSO, giám sát dịch vụ kỹ thuật. **Bị cách ly hoàn toàn khỏi điểm số đánh giá**. |
| 2 | `EXECUTIVE` | Lãnh đạo cấp cao / Người đứng đầu | `ALL` | Phê duyệt mục tiêu chiến lược toàn cơ quan, phê duyệt kết quả xếp loại cuối cùng, mở khóa kỳ đánh giá, ký quyết định khen thưởng/kỷ luật. |
| 3 | `UNIT_HEAD` | Trưởng đơn vị / Trưởng ban | `UNIT_AND_CHILDREN` | Giao KPI cho các phòng trực thuộc, duyệt đánh giá cấp 1, xếp loại sơ bộ viên chức/nhân viên trong đơn vị, giải quyết thắc mắc ban đầu. |
| 4 | `LINE_MANAGER` | Quản lý trực tiếp / Phó phòng | `OWN_UNIT` | Giao KPI chi tiết, theo dõi tiến độ tuần/tháng, tổ chức check-in 1:1, đánh giá và nhận xét sơ bộ nhân viên trực tiếp. |
| 5 | `HR_OFFICER` | Nhân sự / Tổ chức cán bộ | `ALL` | Thiết lập kỳ đánh giá, quản lý thư viện KPI chuẩn, tổ chức quy trình hiệu chuẩn (Calibration), tổng hợp báo cáo và chuẩn bị hồ sơ cho Hội đồng. |
| 6 | `EMPLOYEE` | Người được đánh giá (Cá nhân) | `SELF` | Đăng ký và cam kết KPI cá nhân, cập nhật kết quả và nộp minh chứng, thực hiện tự nhận xét/tự chấm điểm, nộp khiếu nại (nếu có). |
| 7 | `COUNCIL_MEMBER` | Thành viên Hội đồng thi đua - đánh giá | `ALL` | Xem biên bản nhận xét, tham gia họp bỏ phiếu biểu quyết xếp loại, xem xét các trường hợp Hoàn thành xuất sắc nhiệm vụ vượt tỷ lệ khống chế. |
| 8 | `SECRETARY` | Thư ký / Đầu mối tổng hợp | `ALL` | Ghi biên bản họp hội đồng/tập thể, kiểm đếm phiếu biểu quyết, lập bảng tổng hợp điểm và xếp loại trình Người đứng đầu ký. |
| 9 | `AUDITOR` | Kiểm tra giám sát / Thanh tra | `ALL` (Chỉ đọc) | Giám sát độc lập tính tuân thủ quy trình, kiểm tra tính xác thực của minh chứng, rà soát nhật ký kiểm toán (Audit Trail). **Chỉ có quyền đọc**. |
| 10 | `PEER_REVIEWER` | Người đánh giá 360° (Tạm thời) | `ASSIGNED` | Đóng góp ý kiến đánh giá chéo đồng nghiệp theo danh sách phân công trong kỳ. Quyền tự động hết hạn khi đóng cổng 360°. |

---

## 3. CÁC PHẠM VI DỮ LIỆU & CƠ CHẾ CHỐNG TRUY CẬP TRÁI PHÉP (IDOR)

### 3.1. Phân loại 5 cấp độ Data Scope
- **`SELF` (Chỉ bản thân)**: Người dùng chỉ được truy cập vào các bản ghi có `targetUserId === currentUser.id`. Ngăn chặn việc nhân viên xem bài tự đánh giá hoặc minh chứng nhạy cảm của người khác.
- **`OWN_UNIT` (Đơn vị trực thuộc)**: Chỉ được xem/thao tác trên các hồ sơ có `targetUnitId === currentUser.unitId`. Phù hợp cho quản lý nhóm, phó phòng phụ trách nội bộ phòng.
- **`UNIT_AND_CHILDREN` (Đơn vị và các đơn vị cấp con)**: Được truy cập hồ sơ thuộc đơn vị của mình và toàn bộ cây phân cấp phòng ban cấp dưới. Phù hợp cho Trưởng ban/Cục trưởng/Giám đốc khối.
- **`ALL` (Toàn cơ quan / Toàn hệ thống)**: Áp dụng cho Lãnh đạo cấp cao, Ban Giám đốc, Nhân sự (TCCB), Hội đồng và Thanh tra.
- **`ASSIGNED` (Theo phân công cụ thể)**: Chỉ được truy cập đúng các bản ghi nằm trong danh sách phân công cụ thể (`assignedTargetIds.includes(targetRecordId)`). Thường áp dụng cho Đánh giá 360° (`PEER_REVIEWER`) hoặc Tổ kiểm tra chuyên đề.

### 3.2. Cơ chế Query-Level Security Backend
Backend `RbacService.buildDataScopeQuery(user, entityAlias)` tự động sinh mệnh đề lọc WHERE để chèn vào câu truy vấn:

```typescript
// Mẫu truy vấn bảo mật sinh tự động tại backend
switch (dataScope) {
  case DataScopeType.SELF:
    whereClause = `${entityAlias}.userId = :currentUserId`;
    break;
  case DataScopeType.OWN_UNIT:
    whereClause = `${entityAlias}.unitId = :currentUnitId`;
    break;
  case DataScopeType.UNIT_AND_CHILDREN:
    whereClause = `${entityAlias}.unitId IN (:...descendantUnitIds)`;
    break;
  case DataScopeType.ASSIGNED:
    whereClause = `${entityAlias}.userId IN (:...assignedUserIds)`;
    break;
  case DataScopeType.ALL:
    whereClause = '1 = 1';
    break;
}
```

Bất kỳ request API nào gửi `userId` hoặc `unitId` khác với phạm vi cho phép sẽ bị interceptor chặn lại với mã lỗi `403 Forbidden - [IDOR_DETECTED] Không có quyền truy cập dữ liệu ngoài phạm vi được phân công`.

---

## 4. MA TRẬN PHÂN QUYỀN CHI TIẾT (ROLE X PERMISSION MATRIX)

Mỗi quyền hạn được định nghĩa dạng chuẩn hóa: **`{tài_nguyên}:{hành_động}`**. Tổng cộng **35 granular permissions** trải rộng trên 8 nhóm chức năng:

| Mã Quyền (Permission) | Tên Quyền Nghiệp Vụ | ADM | EXE | U_H | L_M | HR | EMP | COU | SEC | AUD | P_R |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Nhóm KPI & Thư viện** | | | | | | | | | | | |
| `kpi:read` | Xem danh sách & chi tiết KPI | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `kpi:create` | Khởi tạo KPI mới | ✓ | | ✓ | ✓ | ✓ | ✓ | | | | |
| `kpi:update` | Chỉnh sửa nội dung chỉ tiêu KPI | ✓ | | ✓ | ✓ | ✓ | ✓ | | | | |
| `kpi:delete` | Xóa chỉ tiêu KPI (trước khi khóa) | ✓ | | ✓ | | ✓ | | | | | |
| `kpi:assign` | Giao KPI cho đơn vị/cá nhân | | ✓ | ✓ | ✓ | ✓ | | | | | |
| `kpi:approve` | Phê duyệt kế hoạch KPI đăng ký | | ✓ | ✓ | ✓ | | | | | | |
| **Nhóm Đánh giá & Xếp loại** | | | | | | | | | | | |
| `evaluation:self` | Tự nhận xét & tự chấm điểm | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `evaluation:peer` | Thực hiện đánh giá đồng nghiệp 360° | | | | | | | | | | ✓ |
| `evaluation:manager_rate`| Quản lý đánh giá & cho điểm | | ✓ | ✓ | ✓ | | | | | | |
| `evaluation:approve` | Phê duyệt kết quả đánh giá sơ bộ | | ✓ | ✓ | | | | | | | |
| `evaluation:council_review`| Tham gia bỏ phiếu Hội đồng | | ✓ | | | | | ✓ | | | |
| `evaluation:executive_decide`| Người đứng đầu quyết định xếp loại | | ✓ | | | | | | | | |
| `evaluation:appeal_resolve` | Thẩm tra & giải quyết khiếu nại | | ✓ | ✓ | | ✓ | | | | | |
| **Nhóm Kỳ Đánh giá** | | | | | | | | | | | |
| `period:read` | Xem thông tin các kỳ đánh giá | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `period:create` | Thiết lập & phát động kỳ đánh giá | ✓ | | | | ✓ | | | | | |
| `period:update` | Cập nhật mốc thời gian kỳ | ✓ | | | | ✓ | | | | | |
| `period:lock` | Đóng cổng & Khóa kỳ đánh giá | ✓ | ✓ | | | ✓ | | | | | |
| `period:unlock` | Phê duyệt Mở khóa kỳ đánh giá | | ✓ | | | | | | | | |
| **Nhóm Tổ chức & Nhân sự** | | | | | | | | | | | |
| `org:read` | Xem cây cơ cấu tổ chức & phòng ban | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `org:manage` | Thêm, sửa, xóa cây tổ chức & vị trí | ✓ | | | | ✓ | | | | | |
| `user:read` | Xem danh sách hồ sơ nhân sự | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `user:manage` | Quản lý hồ sơ, ngạch bậc, chức danh | ✓ | | | | ✓ | | | | | |
| **Nhóm Theo dõi & Tiến độ** | | | | | | | | | | | |
| `progress:update` | Cập nhật số liệu thực hiện & minh chứng| | ✓ | ✓ | ✓ | ✓ | ✓ | | | | |
| `progress:verify` | Xác nhận số liệu thực tế của nhân viên | | | ✓ | ✓ | ✓ | | | | | |
| `checkin:manage` | Đặt lịch & ghi biên bản Check-in 1:1 | | | ✓ | ✓ | | ✓ | | | | |
| **Nhóm Báo cáo & Thống kê** | | | | | | | | | | | |
| `report:read` | Xem báo cáo tiến độ & xếp loại | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `report:export` | Xuất file Excel / PDF báo cáo NĐ 90 | | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | ✓ | |
| `analytics:executive` | Xem biểu đồ phân tích điều hành cấp cao | | ✓ | | | ✓ | | | | | |
| **Nhóm Nhật ký & Tuân thủ** | | | | | | | | | | | |
| `audit:read` | Tra cứu Nhật ký kiểm toán (Audit Trail) | ✓ | ✓ | | | | | | | ✓ | |
| `audit:export` | Xuất dữ liệu kiểm toán phục vụ thanh tra| ✓ | | | | | | | | ✓ | |
| **Nhóm Quản trị RBAC & Hệ thống** | | | | | | | | | | | |
| `rbac:read` | Xem ma trận phân quyền & vai trò | ✓ | | | | | | | | ✓ | |
| `rbac:manage` | Phân quyền, nhân bản role, sửa ma trận | ✓ | | | | | | | | | |
| `system:config` | Cấu hình SSO, 2FA, Email nhắc hẹn | ✓ | | | | | | | | | |
| `backup:manage` | Sao lưu và khôi phục CSDL | ✓ | | | | | | | | | |

*Ghi chú ký hiệu cột: ADM = SYSTEM_ADMIN, EXE = EXECUTIVE, U_H = UNIT_HEAD, L_M = LINE_MANAGER, HR = HR_OFFICER, EMP = EMPLOYEE, COU = COUNCIL_MEMBER, SEC = SECRETARY, AUD = AUDITOR, P_R = PEER_REVIEWER.*

---

## 5. CÁC QUY TẮC CƯỠNG CHẾ TÁCH QUYỀN Ở BACKEND (SEPARATION OF DUTIES - SoD)

Hệ thống cài đặt 6 bộ lọc cưỡng chế tại service backend (`SodPolicyService`), ngăn chặn gian lận và xung đột quyền lợi bất kể yêu cầu đến từ API hay giao diện:

### Rule 1: Không tự phê duyệt, tự xếp loại, tự giải quyết khiếu nại của chính mình (Self-Approval Prohibition)
- **Cơ chế**: Khi thực hiện hành động thuộc nhóm `evaluation:approve`, `evaluation:executive_decide`, hoặc `evaluation:appeal_resolve`, backend kiểm tra `appraisal.targetUserId === actor.id`.
- **Xử lý**: Nếu trùng lặp, backend lập tức quăng lỗi `403 Forbidden: Xung đột lợi ích (SoD) - Người dùng không được tự phê duyệt hoặc tự xếp loại cho chính mình. Hồ sơ phải chuyển lên cấp trên phê duyệt`.

### Rule 2: Người đánh giá phải là cấp trên trực tiếp/gián tiếp theo cây tổ chức (Superior Hierarchy Check)
- **Cơ chế**: Kiểm tra mối quan hệ giữa người chấm và người được chấm dựa trên cây tổ chức phân cấp (`ancestorIds`).
- **Xử lý**: Nếu người chấm không nằm trong tuyến quản lý cấp trên hoặc không có quyền hội đồng được chỉ định, backend trả về lỗi `403 Forbidden: Vi phạm cấp bậc quản lý - Người đánh giá phải là cấp trên trực tiếp hoặc gián tiếp theo sơ đồ tổ chức`.

### Rule 3: Điều chỉnh điểm hoặc mức xếp loại bắt buộc nhập lý do & lưu Audit Trail (Score Adjustment Traceability)
- **Cơ chế**: Mọi hành vi sửa điểm hoặc điều chỉnh mức xếp loại đã chốt phải gửi kèm trường `adjustmentReason` có độ dài tối thiểu **10 ký tự**.
- **Xử lý**: Ghi nhận đồng thời vào bảng `EvaluationAdjustmentLog` với: `oldScore`, `newScore`, `oldClassification`, `newClassification`, `reason`, `adjustedBy`, `timestamp`. Nếu thiếu lý do, request bị từ chối với mã lỗi `400 Bad Request`.

### Rule 4: SYSTEM_ADMIN bị cách ly hoàn toàn khỏi nội dung điểm và nhận xét (Admin Privacy Separation)
- **Cơ chế**: Phân tách quyền lực giữa quản trị kỹ thuật và quản lý nhân sự. Admin có quyền tạo user, phân quyền, cấu hình hệ thống, nhưng khi gọi các API đọc chi tiết phiếu đánh giá (`EvaluationAppraisal`), trường `score`, `comments`, `classification` sẽ bị mask hoặc trả về lỗi `403 Forbidden`.
- **Ý nghĩa**: Đảm bảo tính bảo mật và khách quan tuyệt đối của thông tin nhạy cảm về đánh giá cán bộ công chức/nhân sự.

### Rule 5: AUDITOR chỉ đọc kèm quyền xem toàn bộ Audit Log (Auditor Read-Only)
- **Cơ chế**: Role `AUDITOR` chỉ được cấp các permission có hậu tố `:read` và `:export`. Mọi request dạng POST/PUT/PATCH/DELETE liên quan đến dữ liệu nghiệp vụ gửi từ role này đều bị chặn tại `RbacGuard`.
- **Quyền hạn đặc biệt**: Được quyền đọc toàn bộ nhật ký kiểm toán hệ thống (`audit:read`) và xuất báo cáo giám sát độc lập.

### Rule 6: Kỳ đánh giá đã khóa không ai được sửa đổi; Mở khóa cần phê duyệt có lý do (Locked Period Protection)
- **Cơ chế**: Khi kỳ đánh giá chuyển sang trạng thái `LOCKED` (Đã khóa), toàn bộ các thao tác tạo/sửa/xóa KPI, nhập điểm, cập nhật minh chứng đều bị chặn hoàn toàn đối với mọi vai trò.
- **Quy trình Mở khóa**: Chỉ người có quyền `period:unlock` (thường là `EXECUTIVE`) mới có thể mở khóa, bắt buộc nhập lý do bằng văn bản và lưu lại vào nhật ký kiểm toán.

---

## 6. DANH MỤC GIAO DIỆN & MÀN HÌNH THEO TỪNG VAI TRÒ

Giao diện hệ thống tự động thích ứng hoàn toàn theo `activeRole` được kích hoạt:

| Tên Vai Trò (Active Role) | Dashboard Mặc Định Khi Đăng Nhập | Các Menu Hiển Thị Trên Sidebar | Các Action Buttons Nổi Bật |
|---|---|---|---|
| **SYSTEM_ADMIN** | **Module 6: Quản trị Hệ thống** (Tình trạng máy chủ, CSDL, SSO, Logs) | - Module 1: Quản trị Tổ chức & User<br>- Module 6: Hệ thống & RBAC Matrix | - Sửa ma trận quyền<br>- Nhân bản Role<br>- Bật/tắt Role<br>- Sao lưu/Khôi phục DB |
| **EXECUTIVE** | **Executive Dashboard** (Tổng quan hoàn thành toàn cơ quan, tỷ lệ Xuất sắc) | - Dashboard Lãnh đạo<br>- Module 1: Cây đơn vị<br>- Module 4: Phê duyệt xếp loại<br>- Module 5: Báo cáo NĐ 90 & Xuất file | - Phê duyệt kết quả toàn cơ quan<br>- Khóa / Mở khóa kỳ đánh giá<br>- Quyết định giải quyết khiếu nại |
| **UNIT_HEAD** | **Unit Dashboard** (Tiến độ hoàn thành của các phòng ban cấp dưới) | - Dashboard Đơn vị<br>- Module 1: Cây đơn vị trực thuộc<br>- Module 2: Giao KPI & duyệt kế hoạch<br>- Module 3: Xác nhận minh chứng<br>- Module 4: Đánh giá & xếp loại cấp phòng<br>- Module 5: Báo cáo tổng hợp đơn vị | - Phê duyệt đăng ký KPI của nhân viên<br>- Chấm điểm & nhận xét cấp phòng<br>- Tổ chức họp bình bầu đơn vị |
| **LINE_MANAGER** | **Team Progress Dashboard** (Tiến độ thực hiện KPI tuần/tháng của team) | - Module 2: Thư viện & Giao KPI nhóm<br>- Module 3: Theo dõi & Check-in 1:1<br>- Module 4: Đánh giá sơ bộ nhân viên<br>- Module 5: Báo cáo hiệu suất nhóm | - Xác nhận kết quả thực tế<br>- Đặt lịch & nhập biên bản 1:1<br>- Chấm điểm sơ bộ nhân viên trực tiếp |
| **HR_OFFICER** | **HR Operations Dashboard** (Tiến độ thu thập hồ sơ toàn cơ quan, tỷ lệ nộp) | - Module 1: Quản lý nhân sự & hồ sơ<br>- Module 2: Thiết lập kỳ & Thư viện KPI<br>- Module 3: Đôn đốc tiến độ nộp minh chứng<br>- Module 4: Điều phối hiệu chuẩn (Calibration)<br>- Module 5: Báo cáo & chuẩn bị hồ sơ Hội đồng | - Phát động kỳ đánh giá<br>- Gửi thông báo nhắc hạn in-app<br>- Thiết lập giới hạn tỷ lệ % Xuất sắc<br>- Xuất danh sách trình Hội đồng |
| **EMPLOYEE** | **My KPI Dashboard** (Tiến độ cá nhân, cảnh báo KPI chậm, điểm tự chấm) | - Bàn làm việc cá nhân<br>- Module 2: Đăng ký KPI cá nhân<br>- Module 3: Cập nhật kết quả & Nộp minh chứng<br>- Module 4: Tự nhận xét & xem kết quả xếp loại | - Cam kết kế hoạch KPI<br>- Tải lên minh chứng (PDF/ảnh)<br>- Tự chấm điểm & gửi cấp trên<br>- Gửi phản hồi / khiếu nại |
| **COUNCIL_MEMBER**| **Council Review Board** (Danh sách đề xuất Hoàn thành xuất sắc toàn cơ quan) | - Module 4: Phòng họp Hội đồng & Bỏ phiếu<br>- Module 5: Báo cáo xếp loại tổng hợp | - Xem hồ sơ minh chứng ứng viên<br>- Bỏ phiếu biểu quyết điện tử<br>- Ghi ý kiến phản biện |
| **SECRETARY** | **Secretary Workspace** (Bảng kiểm phiếu biểu quyết & Lập biên bản họp) | - Module 4: Quản lý biên bản họp & biểu quyết<br>- Module 5: Kết xuất báo cáo mẫu NĐ 90 | - Nhập kết quả kiểm phiếu<br>- Soạn thảo biên bản họp đánh giá<br>- Trình Người đứng đầu ký duyệt |
| **AUDITOR** | **Auditor Portal** (Biểu đồ tuân thủ quy trình, các chỉ tiêu bất thường) | - Module 3: Tra cứu tiến độ (Chỉ đọc)<br>- Module 4: Xem kết quả (Chỉ đọc)<br>- Module 6: Nhật ký Kiểm toán (Audit Trail) | - Tra cứu lịch sử thay đổi (diff log)<br>- Kiểm tra tính toàn vẹn minh chứng<br>- Xuất báo cáo thanh tra |
| **PEER_REVIEWER** | **360° Peer Review Station** (Danh sách đồng nghiệp được phân công nhận xét) | - Module 4: Phiếu đánh giá đồng nghiệp 360° | - Chấm điểm tiêu chí hành vi/phối hợp<br>- Nhận xét ẩn danh khách quan<br>- Nộp phiếu đánh giá 360° |

---

## 7. DANH SÁCH TÀI KHOẢN MẪU KIỂM THỬ (TEST SEED DATA)

Tất cả tài khoản trong môi trường thử nghiệm đều có mật khẩu mặc định: `123456` (hỗ trợ chuyển đổi nhanh bằng 1-Click Role Switcher trên Header):

| Username | Họ và Tên | Vai Trò Chính | Các Vai Trò Được Gán (`roles`) | Data Scope | Đơn Vị Công Tác |
|---|---|---|---|---|---|
| `admin` | Nguyễn Quản Trị | `SYSTEM_ADMIN` | `["SYSTEM_ADMIN"]` | `ALL` | Phòng Công nghệ thông tin |
| `giamdoc` | GS. TS. Trần Văn Lãnh Đạo | `EXECUTIVE` | `["EXECUTIVE", "COUNCIL_MEMBER"]` | `ALL` | Ban Giám đốc Cơ quan |
| `truongphong` | ThS. Lê Văn Trưởng | `UNIT_HEAD` | `["UNIT_HEAD", "COUNCIL_MEMBER"]` | `UNIT_AND_CHILDREN`| Phòng Kế hoạch - Tài chính |
| `phophong` | Đỗ Quản Lý Trực Tiếp | `LINE_MANAGER` | `["LINE_MANAGER"]` | `OWN_UNIT` | Phòng Nghiệp vụ 1 |
| `tccb` | ThS. Nguyễn Thị Nhân Sự | `HR_OFFICER` | `["HR_OFFICER", "SECRETARY"]` | `ALL` | Ban Tổ chức Cán bộ |
| `nhanvien` | KS. Lê Hoàng Minh | `EMPLOYEE` | `["EMPLOYEE", "PEER_REVIEWER"]`| `SELF` | Chuyên viên Phòng Kế hoạch |
| `hoidong1` | PGS. TS. Vũ Thành Viên | `COUNCIL_MEMBER` | `["COUNCIL_MEMBER"]` | `ALL` | Hội đồng Thi đua Khen thưởng |
| `thuky` | Hoàng Thị Thư Ký | `SECRETARY` | `["SECRETARY"]` | `ALL` | Văn phòng Tổng hợp |
| `thanh_tra` | Vũ Kiểm Tra Giám Sát | `AUDITOR` | `["AUDITOR"]` | `ALL` (Chỉ đọc) | Ban Thanh tra Nhân dân |
| `dongnghiep` | Đặng Thị Đồng Nghiệp | `PEER_REVIEWER` | `["PEER_REVIEWER", "EMPLOYEE"]`| `ASSIGNED` | Chuyên viên Phòng Kỹ thuật |

---

## 8. HƯỚNG DẪN TÙY BIẾN CHO TỔ CHỨC ĐẶC THÙ (DYNAMIC CONFIGURATION)

Khi áp dụng tại các đơn vị có cơ cấu tinh gọn (ví dụ: *không thành lập Hội đồng riêng*, hoặc *Văn phòng kiêm nhiệm Thư ký và Nhân sự*), quản trị viên hoàn toàn không cần can thiệp mã nguồn:

### 8.1. Bật / Tắt Role linh hoạt
1. Truy cập **Module 6: Tiện ích Hệ thống** > Tab **Ma trận Phân quyền & SoD (RBAC Matrix)**.
2. Tại cột tiêu đề của từng vai trò, nhấp vào công tắc **Active / Bật-Tắt**.
3. Khi một vai trò bị tắt (`isActive: false`):
   - Vai trò đó sẽ biến mất khỏi bộ chọn vai trò trên Header.
   - Các API thuộc về vai trò đó sẽ bị vô hiệu hóa với thông báo rõ ràng.
   - Tài khoản người dùng có vai trò này sẽ tự động chuyển về vai trò khả dụng tiếp theo.

### 8.2. Nhân bản Vai trò (Clone Role)
Khi cần tạo vai trò phái sinh mới (ví dụ: `DEPUTY_EXECUTIVE - Phó Giám đốc phụ trách chuyên môn`, `REGIONAL_DIRECTOR - Giám đốc khu vực`):
1. Nhấp nút **Nhân bản Vai trò (Clone Role)** trên thanh công cụ Quản trị RBAC.
2. Chọn vai trò nguồn (Source Role) để kế thừa toàn bộ 35 thiết lập quyền ban đầu.
3. Nhập mã vai trò mới (chữ in hoa viết liền, ví dụ `DEPUTY_EXECUTIVE`), tên hiển thị và phạm vi dữ liệu áp dụng.
4. Điều chỉnh thêm/bớt các quyền đặc thù trực tiếp trên bảng ma trận và bấm **Lưu thay đổi**.

---

## 9. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

Hệ thống đi kèm bộ kiểm thử tự động toàn diện:
- **Tập tin kiểm thử**: `apps/api/test/rbac-matrix-sod.spec.ts`
- **Số lượng kiểm thử**: **84 test cases**, bao gồm:
  - 10 test suites kiểm thử quyền được phép (`ALLOW`) và bị cấm (`DENY`) của từng role trong số 10 vai trò chuẩn hóa.
  - 5 test suites kiểm tra cơ chế chống IDOR trên cả 5 cấp độ Data Scope (`SELF`, `OWN_UNIT`, `UNIT_AND_CHILDREN`, `ASSIGNED`, `ALL`).
  - 6 test suites kiểm tra nghiêm ngặt 6 quy tắc Separation of Duties (SoD) ở tầng Backend.
- **Tỷ lệ vượt qua**: **100% Pass** (84/84 tests passed cleanly).

---
*Tài liệu được phát hành tự động cùng phiên bản release Phase 1.5 của Hệ thống Quản lý KPI & Đánh giá Hiệu quả Công việc.*
