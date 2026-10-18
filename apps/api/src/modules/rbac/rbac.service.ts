import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RoleType, DataScopeType } from '../../common/enums';

export interface PermissionDefinition {
  code: string;       // e.g. "kpi:assign"
  name: string;
  resource: string;   // e.g. "kpi"
  action: string;     // e.g. "assign"
  description: string;
}

export interface RoleConfig {
  code: string;
  name: string;
  description: string;
  dataScope: DataScopeType;
  isActive: boolean;
  isSystem: boolean;
  permissions: string[]; // List of permission codes: "kpi:assign", etc.
}

export interface UserContext {
  id: string;
  fullName: string;
  departmentId: string;
  departmentPath: string;
  roles: string[];
  activeRole: string;
  dataScope: DataScopeType;
  assignedTargetIds?: string[]; // for ASSIGNED scope
}

@Injectable()
export class RbacService {
  // 1. Master List of granular permissions in "resource:action" format
  private readonly allPermissions: PermissionDefinition[] = [
    // KPI Library & Planning
    { code: 'kpi:create', resource: 'kpi', action: 'create', name: 'Tạo KPI', description: 'Tạo mới chỉ tiêu trong thư viện KPI' },
    { code: 'kpi:read', resource: 'kpi', action: 'read', name: 'Xem KPI', description: 'Xem danh mục chỉ tiêu KPI' },
    { code: 'kpi:assign', resource: 'kpi', action: 'assign', name: 'Giao KPI', description: 'Phân bổ và giao chỉ tiêu cho cấp dưới' },
    { code: 'kpi:revise', resource: 'kpi', action: 'revise', name: 'Điều chỉnh KPI', description: 'Yêu cầu điều chỉnh hoặc chỉnh sửa chỉ tiêu giữa kỳ' },
    { code: 'kpi:accept', resource: 'kpi', action: 'accept', name: 'Xác nhận KPI', description: 'Đồng thuận tiếp nhận KPI được giao' },
    { code: 'kpi:approve', resource: 'kpi', action: 'approve', name: 'Duyệt KPI', description: 'Phê duyệt kế hoạch KPI chính thức' },
    { code: 'kpi:lock', resource: 'kpi', action: 'lock', name: 'Khóa KPI', description: 'Khóa mục tiêu bất biến trong kỳ' },

    // Tracking & Execution
    { code: 'tracking:checkin', resource: 'tracking', action: 'checkin', name: 'Cập nhật tiến độ', description: 'Cập nhật số liệu thực tế và đính kèm minh chứng' },
    { code: 'tracking:verify', resource: 'tracking', action: 'verify', name: 'Xác nhận số liệu', description: 'Quản lý thẩm tra và xác nhận minh chứng' },
    { code: 'tracking:1on1', resource: 'tracking', action: '1on1', name: 'Họp Check-in 1:1', description: 'Tổ chức và ghi nhận biên bản check-in định kỳ' },
    { code: 'tracking:schedule', resource: 'tracking', action: 'schedule', name: 'Quản lý Job nền', description: 'Cấu hình và kích hoạt quét cảnh báo tiến độ' },

    // Evaluation Workflow
    { code: 'evaluation:self', resource: 'evaluation', action: 'self', name: 'Tự đánh giá', description: 'Lập phiếu tự nhận xét và chấm điểm cá nhân' },
    { code: 'evaluation:manager_assess', resource: 'evaluation', action: 'manager_assess', name: 'Quản lý đánh giá', description: 'Chấm điểm và nhận xét cấp dưới' },
    { code: 'evaluation:collective', resource: 'evaluation', action: 'collective', name: 'Hội nghị tập thể', description: 'Nhập biên bản họp và số phiếu biểu quyết tập thể' },
    { code: 'evaluation:council_review', resource: 'evaluation', action: 'council_review', name: 'Thẩm định Hội đồng', description: 'Hội đồng xem xét và thẩm định kết quả' },
    { code: 'evaluation:approve', resource: 'evaluation', action: 'approve', name: 'Phê duyệt xếp loại', description: 'Người đứng đầu ban hành quyết định xếp loại' },
    { code: 'evaluation:adjust_score', resource: 'evaluation', action: 'adjust_score', name: 'Điều chỉnh điểm/xếp loại', description: 'Hiệu chỉnh kết quả kèm giải trình bắt buộc' },
    { code: 'evaluation:publish', resource: 'evaluation', action: 'publish', name: 'Công bố kết quả', description: 'Công bố kết quả xếp loại đến cán bộ' },
    { code: 'evaluation:appeal', resource: 'evaluation', action: 'appeal', name: 'Khiếu nại/Giải trình', description: 'Gửi khiếu nại hoặc tiếp nhận xử lý giải trình' },

    // Assessment Period
    { code: 'period:create', resource: 'period', action: 'create', name: 'Tạo kỳ đánh giá', description: 'Mở kỳ đánh giá tháng/quý/năm' },
    { code: 'period:update', resource: 'period', action: 'update', name: 'Sửa kỳ đánh giá', description: 'Cập nhật thông tin kỳ' },
    { code: 'period:lock', resource: 'period', action: 'lock', name: 'Khóa kỳ đánh giá', description: 'Khóa kỳ đánh giá không cho sửa đổi' },
    { code: 'period:unlock', resource: 'period', action: 'unlock', name: 'Mở khóa kỳ đánh giá', description: 'Mở khóa kỳ đánh giá theo quy trình kiểm toán' },

    // Organization & Users
    { code: 'department:manage', resource: 'department', action: 'manage', name: 'Quản trị đơn vị', description: 'Quản lý cơ cấu cây đơn vị phòng ban' },
    { code: 'user:manage', resource: 'user', action: 'manage', name: 'Quản trị nhân sự', description: 'Tạo, sửa, khóa tài khoản cán bộ' },
    { code: 'user:import', resource: 'user', action: 'import', name: 'Import nhân sự', description: 'Nhập danh sách cán bộ từ file Excel' },

    // Reporting & Exploitation
    { code: 'report:view_unit', resource: 'report', action: 'view_unit', name: 'Xem báo cáo đơn vị', description: 'Xem tổng hợp tiến độ và xếp loại của đơn vị' },
    { code: 'report:view_all', resource: 'report', action: 'view_all', name: 'Xem báo cáo toàn cơ quan', description: 'Dashboard lãnh đạo và báo cáo toàn ngành' },
    { code: 'report:export_excel', resource: 'report', action: 'export_excel', name: 'Xuất Excel/PDF', description: 'Trích xuất biểu mẫu NĐ 90 và bảng kết quả' },
    { code: 'report:export_salary', resource: 'report', action: 'export_salary', name: 'Xuất lương thưởng KPI', description: 'Trích xuất bảng thanh toán lương thưởng theo K_KPI' },
    { code: 'report:export_planning', resource: 'report', action: 'export_planning', name: 'Xuất quy hoạch cán bộ', description: 'Trích xuất danh sách bổ nhiệm và nâng lương trước hạn' },

    // Audit & RBAC Matrix Management
    { code: 'audit:read', resource: 'audit', action: 'read', name: 'Xem Nhật ký kiểm toán', description: 'Tra cứu lịch sử biến động dữ liệu toàn hệ thống' },
    { code: 'rbac:manage_matrix', resource: 'rbac', action: 'manage_matrix', name: 'Quản trị ma trận quyền', description: 'Bật tắt quyền hạn cho các vai trò' },
    { code: 'rbac:clone_role', resource: 'rbac', action: 'clone_role', name: 'Sao chép vai trò', description: 'Tạo vai trò mới dựa trên vai trò sẵn có' },
    { code: 'rbac:toggle_role', resource: 'rbac', action: 'toggle_role', name: 'Bật/tắt vai trò', description: 'Kích hoạt hoặc tạm dừng áp dụng vai trò trong tổ chức' },
  ];

  // 2. Master Role Configurations (All 10 Standard Roles)
  private roles: Map<string, RoleConfig> = new Map([
    [
      RoleType.SYSTEM_ADMIN,
      {
        code: RoleType.SYSTEM_ADMIN,
        name: 'Quản trị viên Hệ thống (System Admin)',
        description: 'Quản trị tài khoản, cơ cấu đơn vị, hạ tầng kỹ thuật và ma trận phân quyền. Không xem nội dung đánh giá mật.',
        dataScope: DataScopeType.ALL,
        isActive: true,
        isSystem: true,
        permissions: [
          'user:manage', 'user:import', 'department:manage',
          'period:create', 'period:update', 'period:lock',
          'audit:read', 'rbac:manage_matrix', 'rbac:clone_role', 'rbac:toggle_role',
          'kpi:read', 'tracking:schedule',
        ],
      },
    ],
    [
      RoleType.EXECUTIVE,
      {
        code: RoleType.EXECUTIVE,
        name: 'Lãnh đạo cấp cao / Người đứng đầu (Executive)',
        description: 'Thẩm quyền tối cao về nhân sự: duyệt quyết định xếp loại, khống chế trần 20%, điều chỉnh điểm, mở khóa kỳ, xem dashboard toàn diện.',
        dataScope: DataScopeType.ALL,
        isActive: true,
        isSystem: true,
        permissions: [
          'kpi:read', 'kpi:approve', 'kpi:lock',
          'evaluation:approve', 'evaluation:adjust_score', 'evaluation:publish',
          'period:lock', 'period:unlock',
          'report:view_all', 'report:export_excel', 'report:export_salary', 'report:export_planning',
          'audit:read',
        ],
      },
    ],
    [
      RoleType.UNIT_HEAD,
      {
        code: RoleType.UNIT_HEAD,
        name: 'Trưởng đơn vị (Unit Head)',
        description: 'Chủ trì đánh giá khối đơn vị, phân bổ KPI phòng ban, chủ trì hội nghị tập thể, duyệt hàng loạt kết quả đơn vị mình phụ trách.',
        dataScope: DataScopeType.UNIT_AND_CHILDREN,
        isActive: true,
        isSystem: true,
        permissions: [
          'kpi:create', 'kpi:read', 'kpi:assign', 'kpi:revise', 'kpi:approve',
          'tracking:verify', 'tracking:1on1',
          'evaluation:manager_assess', 'evaluation:collective', 'evaluation:adjust_score',
          'report:view_unit', 'report:export_excel',
        ],
      },
    ],
    [
      RoleType.LINE_MANAGER,
      {
        code: RoleType.LINE_MANAGER,
        name: 'Quản lý trực tiếp (Line Manager)',
        description: 'Trực tiếp giao việc, duyệt minh chứng tiến độ hàng kỳ, thực hiện 1:1 và chấm điểm sơ bộ cấp dưới.',
        dataScope: DataScopeType.OWN_UNIT,
        isActive: true,
        isSystem: true,
        permissions: [
          'kpi:create', 'kpi:read', 'kpi:assign', 'kpi:revise', 'kpi:approve',
          'tracking:verify', 'tracking:1on1',
          'evaluation:manager_assess',
          'report:view_unit', 'report:export_excel',
        ],
      },
    ],
    [
      RoleType.HR_OFFICER,
      {
        code: RoleType.HR_OFFICER,
        name: 'Nhân sự / Tổ chức Cán bộ (HR Officer)',
        description: 'Tham mưu mở kỳ đánh giá, quản trị thư viện KPI chuẩn, kiểm soát trần 20%, xuất biểu mẫu NĐ 90 và bảng lương/khen thưởng.',
        dataScope: DataScopeType.ALL,
        isActive: true,
        isSystem: true,
        permissions: [
          'kpi:create', 'kpi:read',
          'period:create', 'period:update', 'period:lock',
          'evaluation:publish',
          'user:manage', 'user:import',
          'report:view_all', 'report:export_excel', 'report:export_salary', 'report:export_planning',
          'audit:read',
        ],
      },
    ],
    [
      RoleType.EMPLOYEE,
      {
        code: RoleType.EMPLOYEE,
        name: 'Người được đánh giá / Cán bộ nhân viên (Employee)',
        description: 'Nhận chỉ tiêu, cập nhật tiến độ định kỳ, nộp minh chứng, đặt lịch check-in 1:1, tự chấm điểm và gửi khiếu nại.',
        dataScope: DataScopeType.SELF,
        isActive: true,
        isSystem: true,
        permissions: [
          'kpi:read', 'kpi:accept', 'kpi:revise',
          'tracking:checkin', 'tracking:1on1',
          'evaluation:self', 'evaluation:appeal',
        ],
      },
    ],
    [
      RoleType.COUNCIL_MEMBER,
      {
        code: RoleType.COUNCIL_MEMBER,
        name: 'Thành viên Hội đồng Thi đua (Council Member)',
        description: 'Thẩm định hồ sơ thi đua khen thưởng, thẩm định hồ sơ đề nghị xếp loại Xuất sắc theo phân công.',
        dataScope: DataScopeType.ASSIGNED,
        isActive: true,
        isSystem: true,
        permissions: [
          'kpi:read',
          'evaluation:council_review',
          'report:view_unit', 'report:export_excel',
        ],
      },
    ],
    [
      RoleType.SECRETARY,
      {
        code: RoleType.SECRETARY,
        name: 'Thư ký / Đầu mối Tổng hợp (Secretary)',
        description: 'Ghi chép biên bản hội nghị tập thể, kiểm phiếu biểu quyết, tổng hợp số liệu và chuẩn bị mẫu biểu hành chính.',
        dataScope: DataScopeType.OWN_UNIT,
        isActive: true,
        isSystem: true,
        permissions: [
          'kpi:read',
          'evaluation:collective',
          'report:view_unit', 'report:export_excel',
        ],
      },
    ],
    [
      RoleType.AUDITOR,
      {
        code: RoleType.AUDITOR,
        name: 'Kiểm tra giám sát / Thanh tra (Auditor)',
        description: 'Chỉ đọc toàn bộ báo cáo, kiểm toán quy chế, tra cứu nhật ký kiểm toán. Nghiêm cấm mọi hành vi ghi/sửa.',
        dataScope: DataScopeType.ALL,
        isActive: true,
        isSystem: true,
        permissions: [
          'kpi:read',
          'report:view_all', 'report:export_excel',
          'audit:read',
        ],
      },
    ],
    [
      RoleType.PEER_REVIEWER,
      {
        code: RoleType.PEER_REVIEWER,
        name: 'Đánh giá 360° / Đồng nghiệp (Peer Reviewer)',
        description: 'Vai trò tạm thời trong kỳ đánh giá 360 độ: chấm điểm phản hồi cho đồng nghiệp được phân công.',
        dataScope: DataScopeType.ASSIGNED,
        isActive: true,
        isSystem: true,
        permissions: [
          'kpi:read',
          'evaluation:self', // review colleague
        ],
      },
    ],
  ]);

  /**
   * Lấy toàn bộ danh mục Permission định nghĩa
   */
  getAllPermissions(): PermissionDefinition[] {
    return this.allPermissions;
  }

  /**
   * Lấy danh sách toàn bộ các Role kèm ma trận quyền
   */
  getAllRoles(): RoleConfig[] {
    return Array.from(this.roles.values());
  }

  /**
   * Lấy thông tin chi tiết một Role
   */
  getRole(code: string): RoleConfig {
    const role = this.roles.get(code);
    if (!role) {
      throw new NotFoundException(`Vai trò "${code}" không tồn tại trong hệ thống.`);
    }
    return role;
  }

  /**
   * Kiểm tra quyền của một vai trò với hành động "resource:action"
   */
  hasPermission(roleCode: string, permissionCode: string): boolean {
    const role = this.roles.get(roleCode);
    if (!role || !role.isActive) return false;
    return role.permissions.includes(permissionCode);
  }

  /**
   * Cập nhật danh sách quyền cho một vai trò (Admin Matrix Editor)
   */
  updateRolePermissions(roleCode: string, permissionCodes: string[]): RoleConfig {
    const role = this.getRole(roleCode);
    // Validate permission codes
    const validCodes = new Set(this.allPermissions.map((p) => p.code));
    for (const code of permissionCodes) {
      if (!validCodes.has(code)) {
        throw new BadRequestException(`Mã quyền "${code}" không hợp lệ.`);
      }
    }

    role.permissions = [...permissionCodes];
    this.roles.set(roleCode, role);
    return role;
  }

  /**
   * Sao chép vai trò (Clone Role)
   */
  cloneRole(sourceRoleCode: string, newRoleCode: string, newRoleName: string, description?: string): RoleConfig {
    const source = this.getRole(sourceRoleCode);
    if (this.roles.has(newRoleCode)) {
      throw new BadRequestException(`Mã vai trò mới "${newRoleCode}" đã tồn tại!`);
    }

    const cloned: RoleConfig = {
      code: newRoleCode,
      name: newRoleName,
      description: description || `Sao chép từ vai trò ${source.name}`,
      dataScope: source.dataScope,
      isActive: true,
      isSystem: false,
      permissions: [...source.permissions],
    };

    this.roles.set(newRoleCode, cloned);
    return cloned;
  }

  /**
   * Bật / Tắt vai trò theo cấu hình của từng tổ chức
   * (Ví dụ tổ chức không có Hội đồng thì tắt COUNCIL_MEMBER)
   */
  toggleRoleActive(roleCode: string, isActive: boolean): RoleConfig {
    const role = this.getRole(roleCode);
    if (roleCode === RoleType.SYSTEM_ADMIN && !isActive) {
      throw new BadRequestException('Không thể vô hiệu hóa vai trò Quản trị viên hệ thống (SYSTEM_ADMIN)!');
    }

    role.isActive = isActive;
    this.roles.set(roleCode, role);
    return role;
  }

  /**
   * LỌC DỮ LIỆU TẦNG QUERY (Query Filter Builder - Chống IDOR)
   * Trả về điều kiện truy vấn Prisma tương ứng theo dataScope của user
   */
  buildDataScopeQuery(user: UserContext): any {
    switch (user.dataScope) {
      case DataScopeType.ALL:
        return {}; // Toàn quyền xem

      case DataScopeType.UNIT_AND_CHILDREN:
        // Đơn vị và cấp con theo tiền tố đường dẫn path
        return {
          department: {
            path: { startsWith: user.departmentPath },
          },
        };

      case DataScopeType.OWN_UNIT:
        // Chỉ đơn vị trực tiếp
        return {
          departmentId: user.departmentId,
        };

      case DataScopeType.SELF:
        // Chỉ bản thân người dùng
        return {
          id: user.id,
        };

      case DataScopeType.ASSIGNED:
        // Theo danh sách phân công
        return {
          id: { in: user.assignedTargetIds || [] },
        };

      default:
        return { id: user.id };
    }
  }

  /**
   * Kiểm tra truy cập chéo dữ liệu (IDOR Validation)
   * Ném ForbiddenException nếu vi phạm phạm vi dữ liệu
   */
  validateTargetAccess(
    user: UserContext,
    target: { id?: string; userId?: string; departmentId?: string; departmentPath?: string }
  ): boolean {
    // 1. Scope ALL: luôn được phép
    if (user.dataScope === DataScopeType.ALL) {
      return true;
    }

    // 2. Scope SELF: chỉ được truy cập nếu là chính mình
    if (user.dataScope === DataScopeType.SELF) {
      const targetId = target.userId || target.id;
      if (targetId && targetId !== user.id) {
        throw new ForbiddenException(
          `Vi phạm phạm vi dữ liệu (IDOR Blocked): Vai trò hiện tại (${user.activeRole}) chỉ được thao tác với dữ liệu của chính mình!`
        );
      }
      return true;
    }

    // 3. Scope OWN_UNIT: chỉ trong nội bộ đơn vị
    if (user.dataScope === DataScopeType.OWN_UNIT) {
      if (target.departmentId && target.departmentId !== user.departmentId) {
        throw new ForbiddenException(
          `Vi phạm phạm vi dữ liệu (IDOR Blocked): Bạn chỉ có quyền truy cập dữ liệu trong nội bộ đơn vị "${user.departmentId}"!`
        );
      }
      return true;
    }

    // 4. Scope UNIT_AND_CHILDREN: đơn vị mục tiêu phải là con hoặc chính đơn vị mình
    if (user.dataScope === DataScopeType.UNIT_AND_CHILDREN) {
      if (target.departmentPath && !target.departmentPath.startsWith(user.departmentPath)) {
        throw new ForbiddenException(
          `Vi phạm phạm vi dữ liệu (IDOR Blocked): Đơn vị mục tiêu không nằm trong nhánh phân cấp trực thuộc của bạn!`
        );
      }
      return true;
    }

    // 5. Scope ASSIGNED: phải nằm trong danh sách được phân công
    if (user.dataScope === DataScopeType.ASSIGNED) {
      const targetId = target.userId || target.id;
      if (targetId && !user.assignedTargetIds?.includes(targetId)) {
        throw new ForbiddenException(
          `Vi phạm phạm vi dữ liệu (IDOR Blocked): Hồ sơ này không nằm trong danh sách được phân công thẩm định/đánh giá!`
        );
      }
      return true;
    }

    return true;
  }
}
