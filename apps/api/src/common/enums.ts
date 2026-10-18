// ==============================================================================
// DOMAIN ENUMS FOR BACKEND REST API
// ==============================================================================

export enum OperatingMode {
  ENTERPRISE = 'ENTERPRISE',
  GOVERNMENT = 'GOVERNMENT',
  HYBRID = 'HYBRID',
}

export enum EmployeeType {
  CAN_BO = 'CAN_BO',
  CONG_CHUC = 'CONG_CHUC',
  VIEN_CHUC = 'VIEN_CHUC',
  NHAN_VIEN_HOP_DONG = 'NHAN_VIEN_HOP_DONG',
  DOANH_NGHIEP = 'DOANH_NGHIEP',
}

export enum ContractType {
  KHONG_XAC_DINH_THOI_HAN = 'KHONG_XAC_DINH_THOI_HAN',
  XAC_DINH_THOI_HAN = 'XAC_DINH_THOI_HAN',
  HOP_DONG_111 = 'HOP_DONG_111',
  THU_VIEC = 'THU_VIEC',
}

export enum RoleType {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',       // Quản trị viên hệ thống tối cao
  SUPER_ADMIN = 'SYSTEM_ADMIN',        // Alias tương thích ngược
  EXECUTIVE = 'EXECUTIVE',             // Lãnh đạo cấp cao / Người đứng đầu
  HEAD_OF_AGENCY = 'EXECUTIVE',        // Alias tương thích ngược
  UNIT_HEAD = 'UNIT_HEAD',             // Trưởng đơn vị
  DEPT_HEAD = 'UNIT_HEAD',             // Alias tương thích ngược
  LINE_MANAGER = 'LINE_MANAGER',       // Quản lý trực tiếp
  DEPT_DEPUTY = 'LINE_MANAGER',        // Alias tương thích ngược
  HR_OFFICER = 'HR_OFFICER',           // Nhân sự / Tổ chức cán bộ
  HR_ADMIN = 'HR_OFFICER',             // Alias tương thích ngược
  EMPLOYEE = 'EMPLOYEE',               // Người được đánh giá / Cán bộ nhân viên
  COUNCIL_MEMBER = 'COUNCIL_MEMBER',   // Thành viên Hội đồng thi đua khen thưởng
  SECRETARY = 'SECRETARY',             // Thư ký / Đầu mối tổng hợp
  AUDITOR = 'AUDITOR',                 // Kiểm tra giám sát, thanh tra (Chỉ đọc)
  PEER_REVIEWER = 'PEER_REVIEWER',     // Đánh giá 360°, vai trò tạm thời
}

export enum DataScopeType {
  ALL = 'ALL',                                     // Toàn bộ hệ thống
  UNIT_AND_CHILDREN = 'UNIT_AND_CHILDREN',         // Đơn vị và các cấp trực thuộc
  DEPARTMENT_AND_CHILDREN = 'UNIT_AND_CHILDREN',   // Alias tương thích ngược
  OWN_UNIT = 'OWN_UNIT',                           // Chỉ nội bộ đơn vị
  DEPARTMENT_ONLY = 'OWN_UNIT',                    // Alias tương thích ngược
  SELF = 'SELF',                                   // Chỉ bản thân
  SELF_ONLY = 'SELF',                              // Alias tương thích ngược
  ASSIGNED = 'ASSIGNED',                           // Theo danh sách phân công cụ thể
}

export enum PeriodType {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUAL = 'SEMI_ANNUAL',
  ANNUAL = 'ANNUAL',
}

export enum PeriodStatus {
  DRAFT = 'DRAFT',
  PLANNING = 'PLANNING',
  ASSIGNING = 'ASSIGNING',
  IN_PROGRESS = 'IN_PROGRESS',
  EVALUATING = 'EVALUATING',
  REVIEWING = 'REVIEWING',
  LOCKED = 'LOCKED',
  ARCHIVED = 'ARCHIVED',
}

export enum KpiType {
  QUANTITATIVE = 'QUANTITATIVE',
  QUALITATIVE = 'QUALITATIVE',
  BINARY = 'BINARY',
  MILESTONE = 'MILESTONE',
}

export enum ScoringMethod {
  LINEAR = 'LINEAR',
  STEP = 'STEP',
  BINARY_PASS_FAIL = 'BINARY_PASS_FAIL',
}

export enum TargetDirection {
  HIGHER_IS_BETTER = 'HIGHER_IS_BETTER',
  LOWER_IS_BETTER = 'LOWER_IS_BETTER',
}

export enum KpiAssignmentStatus {
  DRAFT = 'DRAFT',
  ASSIGNED = 'ASSIGNED',
  FEEDBACK_REQUESTED = 'FEEDBACK_REQUESTED',
  ACCEPTED = 'ACCEPTED',
  APPROVED = 'APPROVED',
  LOCKED = 'LOCKED',
}

export enum EvaluationStatus {
  DRAFT = 'DRAFT',
  SELF_EVALUATED = 'SELF_EVALUATED',
  COLLECTIVE_REVIEW = 'COLLECTIVE_REVIEW',
  MANAGER_ASSESSED = 'MANAGER_ASSESSED',
  COUNCIL_APPRAISED = 'COUNCIL_APPRAISED',
  HEAD_APPROVED = 'HEAD_APPROVED',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
}

export enum GovClassification {
  HOAN_THANH_XUAT_SAC = 'HOAN_THANH_XUAT_SAC',
  HOAN_THANH_TOT = 'HOAN_THANH_TOT',
  HOAN_THANH = 'HOAN_THANH',
  KHONG_HOAN_THANH = 'KHONG_HOAN_THANH',
}

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
