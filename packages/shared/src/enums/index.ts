// ==============================================================================
// ENUMS FOR DUAL-MODE KPI SYSTEM (ENTERPRISE & PUBLIC SECTOR)
// ==============================================================================

/**
 * Chế độ hoạt động của Hệ thống / Đơn vị / Kỳ đánh giá
 */
export enum OperatingMode {
  ENTERPRISE = 'ENTERPRISE', // Doanh nghiệp: KPI, OKR, BSC, 360°, gắn lương thưởng
  GOVERNMENT = 'GOVERNMENT', // Cơ quan Nhà nước: NĐ 90/2020/NĐ-CP & NĐ 48/2023/NĐ-CP
  HYBRID = 'HYBRID',         // Kết hợp: Đơn vị hành chính dùng GOV, khối SXKD dùng ENTERPRISE
}

/**
 * Phân loại đối tượng nhân sự / cán bộ theo Luật Cán bộ, công chức & Luật Viên chức
 */
export enum EmployeeType {
  CAN_BO = 'CAN_BO',                         // Cán bộ (bầu cử, phê chuẩn theo nhiệm kỳ)
  CONG_CHUC = 'CONG_CHUC',                   // Công chức (tuyển dụng, bổ nhiệm vào ngạch)
  VIEN_CHUC = 'VIEN_CHUC',                   // Viên chức (làm việc tại đơn vị sự nghiệp công lập)
  NHAN_VIEN_HOP_DONG = 'NHAN_VIEN_HOP_DONG', // Nhân viên hợp đồng theo Nghị định 111/2022/NĐ-CP
  DOANH_NGHIEP = 'DOANH_NGHIEP',             // Nhân sự theo hợp đồng lao động doanh nghiệp
}

/**
 * Loại Hợp đồng làm việc / Hợp đồng lao động
 */
export enum ContractType {
  KHONG_XAC_DINH_THOI_HAN = 'KHONG_XAC_DINH_THOI_HAN', // Hợp đồng không xác định thời hạn / Biên chế
  XAC_DINH_THOI_HAN = 'XAC_DINH_THOI_HAN',             // Hợp đồng làm việc 12 - 36 tháng
  HOP_DONG_111 = 'HOP_DONG_111',                       // Hợp đồng hỗ trợ, phục vụ theo NĐ 111/2022
  THU_VIEC = 'THU_VIEC',                               // Tập sự / Thử việc
}

/**
 * Hệ thống Vai trò RBAC (Role-Based Access Control)
 */
export enum RoleType {
  SUPER_ADMIN = 'SUPER_ADMIN',         // Quản trị viên hệ thống tối cao
  HR_ADMIN = 'HR_ADMIN',               // Quản trị Nhân sự / Vụ Tổ chức Cán bộ
  HEAD_OF_AGENCY = 'HEAD_OF_AGENCY',   // Người đứng đầu cơ quan / Tổng Giám đốc (Quyết định xếp loại)
  DEPT_HEAD = 'DEPT_HEAD',             // Trưởng đơn vị / Trưởng phòng (Phê duyệt cấp 1)
  DEPT_DEPUTY = 'DEPT_DEPUTY',         // Phó phòng / Cấp phó (Được ủy quyền nhận xét)
  EMPLOYEE = 'EMPLOYEE',               // Cán bộ / Công chức / Viên chức / Nhân viên
  COUNCIL_MEMBER = 'COUNCIL_MEMBER',   // Thành viên Hội đồng thi đua khen thưởng / Thẩm định
}

/**
 * Phạm vi dữ liệu (Data Scope) theo cây đơn vị tổ chức
 */
export enum DataScopeType {
  ALL = 'ALL',                                         // Xem toàn bộ hệ thống (Super Admin, Lãnh đạo cấp cao)
  DEPARTMENT_AND_CHILDREN = 'DEPARTMENT_AND_CHILDREN', // Đơn vị hiện tại và tất cả phòng ban cấp con
  DEPARTMENT_ONLY = 'DEPARTMENT_ONLY',                 // Chỉ trong nội bộ phòng ban trực tiếp
  SELF_ONLY = 'SELF_ONLY',                             // Chỉ bản thân người dùng
}

/**
 * Loại chu kỳ đánh giá
 */
export enum PeriodType {
  MONTHLY = 'MONTHLY',         // Đánh giá hàng tháng
  QUARTERLY = 'QUARTERLY',     // Đánh giá theo quý
  SEMI_ANNUAL = 'SEMI_ANNUAL', // Đánh giá 6 tháng
  ANNUAL = 'ANNUAL',           // Đánh giá năm (Theo NĐ 90/2020)
}

/**
 * Trạng thái của Kỳ đánh giá (Period Status Lifecycle)
 */
export enum PeriodStatus {
  DRAFT = 'DRAFT',               // Bản nháp cấu hình kỳ
  PLANNING = 'PLANNING',         // Đang giao chỉ tiêu / Đăng ký KPI
  ASSIGNING = 'ASSIGNING',       // Giao KPI
  IN_PROGRESS = 'IN_PROGRESS',   // Đang trong giai đoạn thực thi theo dõi
  EVALUATING = 'EVALUATING',     // Đang mở tiếp nhận chấm điểm & góp ý
  REVIEWING = 'REVIEWING',       // Hội đồng / Người đứng đầu đang xem xét xếp loại
  LOCKED = 'LOCKED',             // Đã khóa kỳ - Dữ liệu bất biến (Chỉ mở khóa có lý do)
  ARCHIVED = 'ARCHIVED',         // Đã lưu trữ lịch sử
}

/**
 * Phân loại KPI
 */
export enum KpiType {
  QUANTITATIVE = 'QUANTITATIVE', // Định lượng (đo đếm bằng số liệu, tỷ lệ %, tiền...)
  QUALITATIVE = 'QUALITATIVE',   // Định tính (đánh giá theo mức độ, chất lượng)
  BINARY = 'BINARY',             // Đạt / Không đạt (hoàn thành hoặc chưa hoàn thành)
  MILESTONE = 'MILESTONE',       // Theo mốc thời gian (deadline, tiến độ dự án)
}

/**
 * Phương pháp tính điểm cấu hình được
 */
export enum ScoringMethod {
  LINEAR = 'LINEAR',                     // Tuyến tính: (thực tế / mục tiêu) * 100
  STEP = 'STEP',                         // Bậc thang: theo dải phân chia điểm
  BINARY_PASS_FAIL = 'BINARY_PASS_FAIL', // Đạt / Không đạt
}

/**
 * Chiều hướng chỉ tiêu
 */
export enum TargetDirection {
  HIGHER_IS_BETTER = 'HIGHER_IS_BETTER', // Càng cao càng tốt (Doanh thu, sản lượng, tỷ lệ đúng hạn)
  LOWER_IS_BETTER = 'LOWER_IS_BETTER',   // Càng thấp càng tốt (Tỷ lệ lỗi, chi phí phát sinh, thời gian chờ)
}

/**
 * Trạng thái Bảng giao KPI (KpiAssignment)
 */
export enum KpiAssignmentStatus {
  DRAFT = 'DRAFT',                           // Bản nháp
  ASSIGNED = 'ASSIGNED',                     // Quản lý đã giao
  FEEDBACK_REQUESTED = 'FEEDBACK_REQUESTED', // Nhân viên phản hồi / đề nghị điều chỉnh
  ACCEPTED = 'ACCEPTED',                     // Nhân viên đã xác nhận đồng thuận
  APPROVED = 'APPROVED',                     // Quản lý duyệt chốt
  LOCKED = 'LOCKED',                         // Đã khóa chỉ tiêu
}

/**
 * Trạng thái của Bản ghi đánh giá cá nhân (Individual Evaluation Workflow)
 */
export enum EvaluationStatus {
  DRAFT = 'DRAFT',                           // Cán bộ chuẩn bị phiếu
  SELF_EVALUATED = 'SELF_EVALUATED',         // Đã hoàn thành tự nhận xét & tự chấm điểm
  COLLECTIVE_REVIEW = 'COLLECTIVE_REVIEW',   // Tập thể / Đồng nghiệp đang họp góp ý (NĐ 90) hoặc 360°
  MANAGER_ASSESSED = 'MANAGER_ASSESSED',     // Lãnh đạo trực tiếp đã nhận xét & cho điểm
  COUNCIL_APPRAISED = 'COUNCIL_APPRAISED',   // Hội đồng thẩm định đã họp và đề xuất xếp loại
  HEAD_APPROVED = 'HEAD_APPROVED',           // Người đứng đầu đã ký quyết định xếp loại chính thức
  PUBLISHED = 'PUBLISHED',                   // Đã thông báo công khai tới cán bộ công chức
  REJECTED = 'REJECTED',                     // Bị trả về yêu cầu làm lại/bổ sung minh chứng
}

/**
 * 4 Mức xếp loại Cán bộ, công chức, viên chức theo Nghị định 90/2020 & 48/2023
 */
export enum GovClassificationLevel {
  HOAN_THANH_XUAT_SAC = 'HOAN_THANH_XUAT_SAC', // Hoàn thành xuất sắc nhiệm vụ (Tối đa <= 20% mức Tốt)
  HOAN_THANH_TOT = 'HOAN_THANH_TOT',           // Hoàn thành tốt nhiệm vụ
  HOAN_THANH = 'HOAN_THANH',                   // Hoàn thành nhiệm vụ
  KHONG_HOAN_THANH = 'KHONG_HOAN_THANH',       // Không hoàn thành nhiệm vụ
}

/**
 * Mức xếp loại trong Doanh nghiệp (Enterprise Grading & Salary Multiplier)
 */
export enum EnterpriseGrade {
  GRADE_A_PLUS = 'GRADE_A_PLUS', // Xuất sắc vượt trội (>= 110% target) - Thưởng 150%
  GRADE_A = 'GRADE_A',           // Xuất sắc đạt mục tiêu (100% - 109%) - Thưởng 120%
  GRADE_B = 'GRADE_B',           // Đạt yêu cầu (85% - 99%) - Thưởng 100%
  GRADE_C = 'GRADE_C',           // Cần cải thiện (70% - 84%) - Thưởng 70%
  GRADE_D = 'GRADE_D',           // Không đạt (< 70%) - Không thưởng / Kế hoạch PIP
}

/**
 * Vai trò người tham gia đánh giá
 */
export enum ReviewerType {
  SELF = 'SELF',                           // Tự đánh giá
  DIRECT_MANAGER = 'DIRECT_MANAGER',       // Quản lý trực tiếp
  COLLECTIVE_PEER = 'COLLECTIVE_PEER',     // Tập thể đơn vị / Đồng nghiệp
  SUBORDINATE = 'SUBORDINATE',             // Cấp dưới đánh giá cấp trên (360°)
  CROSS_DEPT_CLIENT = 'CROSS_DEPT_CLIENT', // Khách hàng nội bộ / Phối hợp
  HEAD_OF_AGENCY = 'HEAD_OF_AGENCY',       // Người đứng đầu cơ quan quyết định
  COUNCIL = 'COUNCIL',                     // Hội đồng đánh giá
}

/**
 * Hành động ghi vết Kiểm toán (Audit Action)
 */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SUBMIT = 'SUBMIT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  LOCK_PERIOD = 'LOCK_PERIOD',
  UNLOCK_PERIOD = 'UNLOCK_PERIOD',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT_REPORT = 'EXPORT_REPORT',
  OVERRIDE_QUOTA = 'OVERRIDE_QUOTA',
  IMPORT_EXCEL = 'IMPORT_EXCEL',
  RESET_PASSWORD = 'RESET_PASSWORD',
  ASSIGN_KPI = 'ASSIGN_KPI',
  REVISE_KPI = 'REVISE_KPI',
  ACCEPT_KPI = 'ACCEPT_KPI',
  APPROVE_KPI = 'APPROVE_KPI',
  LOCK_KPI = 'LOCK_KPI',
}

/**
 * Loại Thông báo (Notification Type)
 */
export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  DEADLINE = 'DEADLINE',
  EVALUATION_REQUEST = 'EVALUATION_REQUEST',
}
