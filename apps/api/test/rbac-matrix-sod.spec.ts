import { RbacService } from '../src/modules/rbac/rbac.service';
import { SodPolicyService } from '../src/modules/rbac/sod-policy.service';
import { RoleType, DataScopeType, PeriodStatus } from '../src/common/enums';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('Phase 1.5: RBAC Matrix & Separation of Duties (SoD) Service', () => {
  let rbacService: RbacService;
  let sodService: SodPolicyService;

  beforeEach(() => {
    rbacService = new RbacService();
    sodService = new SodPolicyService();
  });

  describe('1. Chuẩn hóa 10 Role & Ma trận Quyền (resource:action)', () => {
    it('Đầy đủ 10 vai trò chuẩn trong hệ thống', () => {
      const roles = rbacService.getAllRoles();
      expect(roles.length).toBeGreaterThanOrEqual(10);

      const requiredRoleCodes = [
        RoleType.SYSTEM_ADMIN,
        RoleType.EXECUTIVE,
        RoleType.UNIT_HEAD,
        RoleType.LINE_MANAGER,
        RoleType.HR_OFFICER,
        RoleType.EMPLOYEE,
        RoleType.COUNCIL_MEMBER,
        RoleType.SECRETARY,
        RoleType.AUDITOR,
        RoleType.PEER_REVIEWER,
      ];

      for (const code of requiredRoleCodes) {
        const found = roles.find((r) => r.code === code);
        expect(found).toBeDefined();
        expect(found?.isActive).toBe(true);
      }
    });

    it('Kiểm tra quyền hạn chi tiết (hasPermission)', () => {
      // LINE_MANAGER có quyền kpi:assign nhưng không có user:manage
      expect(rbacService.hasPermission(RoleType.LINE_MANAGER, 'kpi:assign')).toBe(true);
      expect(rbacService.hasPermission(RoleType.LINE_MANAGER, 'user:manage')).toBe(false);

      // SYSTEM_ADMIN có quyền user:manage, rbac:manage_matrix nhưng không có evaluation:approve
      expect(rbacService.hasPermission(RoleType.SYSTEM_ADMIN, 'user:manage')).toBe(true);
      expect(rbacService.hasPermission(RoleType.SYSTEM_ADMIN, 'rbac:manage_matrix')).toBe(true);
      expect(rbacService.hasPermission(RoleType.SYSTEM_ADMIN, 'evaluation:approve')).toBe(false);

      // EMPLOYEE có quyền evaluation:self và evaluation:appeal nhưng không có evaluation:approve
      expect(rbacService.hasPermission(RoleType.EMPLOYEE, 'evaluation:self')).toBe(true);
      expect(rbacService.hasPermission(RoleType.EMPLOYEE, 'evaluation:appeal')).toBe(true);
      expect(rbacService.hasPermission(RoleType.EMPLOYEE, 'evaluation:approve')).toBe(false);
    });

    it('Cập nhật ma trận quyền (updateRolePermissions)', () => {
      const newPerms = ['kpi:read', 'tracking:checkin', 'evaluation:self'];
      const updated = rbacService.updateRolePermissions(RoleType.EMPLOYEE, newPerms);
      expect(updated.permissions).toEqual(newPerms);

      // Thử cập nhật quyền không tồn tại -> Báo lỗi BadRequestException
      expect(() =>
        rbacService.updateRolePermissions(RoleType.EMPLOYEE, ['invalid:permission'])
      ).toThrow(BadRequestException);
    });

    it('Sao chép vai trò (cloneRole)', () => {
      const cloned = rbacService.cloneRole(
        RoleType.LINE_MANAGER,
        'DEPUTY_MANAGER',
        'Phó Trưởng phòng',
        'Sao chép từ Quản lý trực tiếp'
      );

      expect(cloned.code).toBe('DEPUTY_MANAGER');
      expect(cloned.name).toBe('Phó Trưởng phòng');
      expect(cloned.permissions).toEqual(rbacService.getRole(RoleType.LINE_MANAGER).permissions);
      expect(cloned.isSystem).toBe(false);

      // Nhân bản trùng mã vai trò -> Lỗi BadRequestException
      expect(() =>
        rbacService.cloneRole(RoleType.LINE_MANAGER, 'DEPUTY_MANAGER', 'Tên trùng')
      ).toThrow(BadRequestException);
    });

    it('Bật/Tắt vai trò theo đặc thù tổ chức (toggleRoleActive)', () => {
      // Vô hiệu hóa COUNCIL_MEMBER nếu tổ chức không có Hội đồng
      const toggled = rbacService.toggleRoleActive(RoleType.COUNCIL_MEMBER, false);
      expect(toggled.isActive).toBe(false);
      expect(rbacService.hasPermission(RoleType.COUNCIL_MEMBER, 'evaluation:council_review')).toBe(false);

      // Không được phép tắt vai trò SYSTEM_ADMIN
      expect(() => rbacService.toggleRoleActive(RoleType.SYSTEM_ADMIN, false)).toThrow(
        BadRequestException
      );
    });
  });

  describe('2. Phạm vi Dữ liệu & Chống Truy cập Chéo Tầng Query (IDOR Prevention)', () => {
    const userAll = {
      id: 'usr-admin',
      fullName: 'Quản trị viên',
      departmentId: 'dept-root',
      departmentPath: '/root',
      roles: [RoleType.SYSTEM_ADMIN],
      activeRole: RoleType.SYSTEM_ADMIN,
      dataScope: DataScopeType.ALL,
    };

    const userUnitAndChildren = {
      id: 'usr-unit-head',
      fullName: 'Trưởng ban',
      departmentId: 'dept-01',
      departmentPath: '/root/dept-01',
      roles: [RoleType.UNIT_HEAD],
      activeRole: RoleType.UNIT_HEAD,
      dataScope: DataScopeType.UNIT_AND_CHILDREN,
    };

    const userOwnUnit = {
      id: 'usr-manager',
      fullName: 'Trưởng phòng',
      departmentId: 'dept-01-01',
      departmentPath: '/root/dept-01/dept-01-01',
      roles: [RoleType.LINE_MANAGER],
      activeRole: RoleType.LINE_MANAGER,
      dataScope: DataScopeType.OWN_UNIT,
    };

    const userSelf = {
      id: 'usr-emp',
      fullName: 'Chuyên viên',
      departmentId: 'dept-01-01',
      departmentPath: '/root/dept-01/dept-01-01',
      roles: [RoleType.EMPLOYEE],
      activeRole: RoleType.EMPLOYEE,
      dataScope: DataScopeType.SELF,
    };

    const userAssigned = {
      id: 'usr-council',
      fullName: 'Ủy viên hội đồng',
      departmentId: 'dept-02',
      departmentPath: '/root/dept-02',
      roles: [RoleType.COUNCIL_MEMBER],
      activeRole: RoleType.COUNCIL_MEMBER,
      dataScope: DataScopeType.ASSIGNED,
      assignedTargetIds: ['usr-target-1', 'usr-target-2'],
    };

    it('Xây dựng Query Filter chuẩn xác cho từng phạm vi', () => {
      expect(rbacService.buildDataScopeQuery(userAll)).toEqual({});
      expect(rbacService.buildDataScopeQuery(userOwnUnit)).toEqual({ departmentId: 'dept-01-01' });
      expect(rbacService.buildDataScopeQuery(userSelf)).toEqual({ id: 'usr-emp' });
      expect(rbacService.buildDataScopeQuery(userAssigned)).toEqual({
        id: { in: ['usr-target-1', 'usr-target-2'] },
      });
      expect(rbacService.buildDataScopeQuery(userUnitAndChildren)).toEqual({
        department: { path: { startsWith: '/root/dept-01' } },
      });
    });

    it('Chặn truy cập chéo dữ liệu người dùng (IDOR) cho phạm vi SELF', () => {
      // Tự truy cập chính mình -> OK
      expect(rbacService.validateTargetAccess(userSelf, { userId: 'usr-emp' })).toBe(true);

      // Thử xem trộm hồ sơ người khác -> Ném ForbiddenException
      expect(() =>
        rbacService.validateTargetAccess(userSelf, { userId: 'usr-other-person' })
      ).toThrow(ForbiddenException);
    });

    it('Chặn truy cập chéo phòng ban khác cho phạm vi OWN_UNIT', () => {
      // Truy cập nội bộ phòng -> OK
      expect(rbacService.validateTargetAccess(userOwnUnit, { departmentId: 'dept-01-01' })).toBe(true);

      // Thử can thiệp phòng khác (dept-02) -> Ném ForbiddenException
      expect(() =>
        rbacService.validateTargetAccess(userOwnUnit, { departmentId: 'dept-02' })
      ).toThrow(ForbiddenException);
    });

    it('Chặn truy cập đơn vị ngoài nhánh cây cho phạm vi UNIT_AND_CHILDREN', () => {
      // Đơn vị con thuộc nhánh /root/dept-01/dept-01-01 -> OK
      expect(
        rbacService.validateTargetAccess(userUnitAndChildren, {
          departmentPath: '/root/dept-01/dept-01-01',
        })
      ).toBe(true);

      // Đơn vị nhánh khác /root/dept-02 -> Ném ForbiddenException
      expect(() =>
        rbacService.validateTargetAccess(userUnitAndChildren, {
          departmentPath: '/root/dept-02/dept-02-01',
        })
      ).toThrow(ForbiddenException);
    });

    it('Chặn truy cập ngoài danh sách phân công cho phạm vi ASSIGNED', () => {
      expect(rbacService.validateTargetAccess(userAssigned, { userId: 'usr-target-1' })).toBe(true);
      expect(() =>
        rbacService.validateTargetAccess(userAssigned, { userId: 'usr-not-assigned' })
      ).toThrow(ForbiddenException);
    });
  });

  describe('3. Cưỡng chế Quy tắc Tách quyền ở Backend (Separation of Duties - SoD)', () => {
    it('Không tự duyệt, tự xếp loại, tự giải quyết khiếu nại của chính mình', () => {
      expect(() =>
        sodService.enforceNoSelfApproval('usr-manager-01', 'usr-manager-01', 'phê duyệt KPI')
      ).toThrow(ForbiddenException);

      // Duyệt cho người khác -> Hợp lệ
      expect(() =>
        sodService.enforceNoSelfApproval('usr-manager-01', 'usr-emp-02', 'phê duyệt KPI')
      ).not.toThrow();
    });

    it('Người đánh giá phải là cấp trên theo cây tổ chức', () => {
      const manager = {
        id: 'mgr-01',
        departmentPath: '/root/dept-1',
        isLeadership: true,
      };

      const directSubordinate = {
        id: 'emp-01',
        managerId: 'mgr-01',
        departmentPath: '/root/dept-1/team-1',
      };

      const descendantSubordinate = {
        id: 'emp-02',
        managerId: 'other-mgr',
        departmentPath: '/root/dept-1/team-2',
      };

      const peerInOtherDept = {
        id: 'emp-03',
        managerId: 'other-mgr',
        departmentPath: '/root/dept-2/team-1',
      };

      // Cấp dưới trực tiếp -> OK
      expect(sodService.enforceSuperiorHierarchy(manager, directSubordinate)).toBe(true);

      // Cấp dưới theo phân cấp cây đơn vị -> OK
      expect(sodService.enforceSuperiorHierarchy(manager, descendantSubordinate)).toBe(true);

      // Cán bộ phòng ban khác -> Ném ForbiddenException
      expect(() => sodService.enforceSuperiorHierarchy(manager, peerInOtherDept)).toThrow(
        ForbiddenException
      );
    });

    it('SYSTEM_ADMIN không đọc được nội dung điểm và nhận xét đánh giá (Privacy Separation)', () => {
      // SYSTEM_ADMIN xem hạ tầng, người dùng, audit log -> Hợp lệ
      expect(() => sodService.enforceAdminPrivacySeparation(RoleType.SYSTEM_ADMIN, 'user')).not.toThrow();
      expect(() => sodService.enforceAdminPrivacySeparation(RoleType.SYSTEM_ADMIN, 'audit_log')).not.toThrow();

      // SYSTEM_ADMIN cố tình đọc điểm và nhận xét mật -> Ném ForbiddenException
      expect(() =>
        sodService.enforceAdminPrivacySeparation(RoleType.SYSTEM_ADMIN, 'evaluation_content')
      ).toThrow(ForbiddenException);

      expect(() =>
        sodService.enforceAdminPrivacySeparation(RoleType.SYSTEM_ADMIN, 'evaluation:scores')
      ).toThrow(ForbiddenException);
    });

    it('AUDITOR chỉ đọc, xem audit log; cấm thao tác ghi / sửa / duyệt', () => {
      // Đọc báo cáo, xem audit log -> Hợp lệ
      expect(() => sodService.enforceAuditorReadOnly(RoleType.AUDITOR, 'view_report')).not.toThrow();
      expect(() => sodService.enforceAuditorReadOnly(RoleType.AUDITOR, 'export_excel')).not.toThrow();
      expect(() => sodService.enforceAuditorReadOnly(RoleType.AUDITOR, 'audit_log')).not.toThrow();

      // Cố tình sửa, duyệt, xóa -> Ném ForbiddenException
      expect(() => sodService.enforceAuditorReadOnly(RoleType.AUDITOR, 'approve_kpi')).toThrow(
        ForbiddenException
      );
      expect(() => sodService.enforceAuditorReadOnly(RoleType.AUDITOR, 'delete_user')).toThrow(
        ForbiddenException
      );
    });

    it('Kỳ đã khóa (LOCKED) không ai sửa được; mở khóa cần quy trình và người phê duyệt', () => {
      // Sửa dữ liệu khi kỳ đang LOCKED -> Bị chặn
      expect(() => sodService.enforceLockedPeriodProtection(PeriodStatus.LOCKED, false)).toThrow(
        BadRequestException
      );

      // Mở khóa nhưng vai trò không phải EXECUTIVE -> Bị chặn
      expect(() =>
        sodService.enforceLockedPeriodProtection(PeriodStatus.LOCKED, true, {
          authorizedRole: RoleType.LINE_MANAGER,
          reason: 'Lý do dài đủ mười lăm ký tự đây',
        })
      ).toThrow(ForbiddenException);

      // Mở khóa với lý do quá ngắn (<15 ký tự) -> Bị chặn
      expect(() =>
        sodService.enforceLockedPeriodProtection(PeriodStatus.LOCKED, true, {
          authorizedRole: RoleType.EXECUTIVE,
          reason: 'Ngắn',
        })
      ).toThrow(BadRequestException);

      // Mở khóa đúng quy chuẩn (EXECUTIVE + lý do >= 15 ký tự) -> Thành công
      expect(() =>
        sodService.enforceLockedPeriodProtection(PeriodStatus.LOCKED, true, {
          authorizedRole: RoleType.EXECUTIVE,
          reason: 'Mở khóa để bổ sung sáng kiến cấp nhà nước của Viện theo kết luận thanh tra',
        })
      ).not.toThrow();
    });

    it('Điều chỉnh điểm hoặc xếp loại bắt buộc nhập lý do, lưu giá trị gốc và giá trị mới', () => {
      const result = sodService.enforceScoreAdjustmentRules(
        82.5,
        91.0,
        'Bổ sung thành tích giải thưởng quốc gia được phê chuẩn',
        RoleType.EXECUTIVE
      );

      expect(result.originalScore).toBe(82.5);
      expect(result.adjustedScore).toBe(91.0);
      expect(result.diff).toBe(8.5);
      expect(result.reason).toContain('giải thưởng quốc gia');

      // Lý do để trống hoặc < 10 ký tự -> Ném BadRequestException
      expect(() =>
        sodService.enforceScoreAdjustmentRules(80, 90, 'Ngắn', RoleType.EXECUTIVE)
      ).toThrow(BadRequestException);

      // Vai trò không có thẩm quyền (EMPLOYEE) -> Ném ForbiddenException
      expect(() =>
        sodService.enforceScoreAdjustmentRules(80, 90, 'Lý do dài trên mười ký tự đây', RoleType.EMPLOYEE)
      ).toThrow(ForbiddenException);
    });
  });
});
