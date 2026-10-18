import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { RoleType, PeriodStatus } from '../../common/enums';

export interface ScoreAdjustmentPayload {
  originalScore: number;
  adjustedScore: number;
  reason: string;
  authorizedRole: RoleType | string;
  diff: number;
}

@Injectable()
export class SodPolicyService {
  /**
   * 1. Cưỡng chế Tách quyền: Không tự duyệt, tự xếp loại, tự giải quyết khiếu nại của chính mình
   */
  enforceNoSelfApproval(evaluatorId: string, targetUserId: string, actionName: string = 'phê duyệt / đánh giá'): void {
    if (evaluatorId && targetUserId && evaluatorId === targetUserId) {
      throw new ForbiddenException(
        `Cưỡng chế tách quyền (Separation of Duties): Cán bộ không được phép tự ${actionName} cho chính bản thân mình!`
      );
    }
  }

  /**
   * 2. Phải là cấp trên theo cây tổ chức mới được đánh giá cấp dưới
   */
  enforceSuperiorHierarchy(
    evaluator: { id: string; departmentPath: string; isLeadership?: boolean },
    target: { id: string; managerId?: string; departmentPath: string }
  ): boolean {
    // Không tự đánh giá
    if (evaluator.id === target.id) {
      throw new ForbiddenException('Người đánh giá không thể là chính người được đánh giá.');
    }

    // Nếu là quản lý trực tiếp
    if (target.managerId && target.managerId === evaluator.id) {
      return true;
    }

    // Hoặc đơn vị của cấp trên phải là tổ tiên của đơn vị cấp dưới (path hierarchy: /root/dept-1/dept-1-1)
    if (
      evaluator.isLeadership &&
      target.departmentPath &&
      evaluator.departmentPath &&
      target.departmentPath.startsWith(evaluator.departmentPath)
    ) {
      return true;
    }

    throw new ForbiddenException(
      'Người đánh giá phải là cấp trên trực tiếp hoặc lãnh đạo đơn vị quản lý trực thuộc theo cây tổ chức!'
    );
  }

  /**
   * 3. SYSTEM_ADMIN không đọc được nội dung điểm và nhận xét đánh giá (Privacy Separation)
   */
  enforceAdminPrivacySeparation(userRole: RoleType | string, resource: string): void {
    const isAdmin = userRole === RoleType.SYSTEM_ADMIN || userRole === 'SYSTEM_ADMIN';
    const isSensitiveEvaluationContent =
      resource === 'evaluation_content' ||
      resource === 'evaluation:scores' ||
      resource === 'evaluation:remarks' ||
      resource === 'evaluation:sensitive_details';

    if (isAdmin && isSensitiveEvaluationContent) {
      throw new ForbiddenException(
        'Cưỡng chế bảo mật (Privacy Separation): Quản trị viên hệ thống (SYSTEM_ADMIN) chỉ quản lý hạ tầng, tài khoản và ma trận quyền, TUYỆT ĐỐI KHÔNG được đọc nội dung điểm và nhận xét đánh giá chi tiết của cán bộ!'
      );
    }
  }

  /**
   * 4. AUDITOR chỉ đọc, xem báo cáo và xem audit log; cấm mọi thao tác ghi / sửa / duyệt
   */
  enforceAuditorReadOnly(userRole: RoleType | string, action: string): void {
    if (userRole === RoleType.AUDITOR || userRole === 'AUDITOR') {
      const allowedActions = ['read', 'view', 'export', 'audit_log', 'list'];
      const isAllowed = allowedActions.some((allowed) => action.toLowerCase().includes(allowed));
      if (!isAllowed) {
        throw new ForbiddenException(
          `Cưỡng chế vai trò Kiểm tra giám sát (AUDITOR): Vai trò này là CHỈ ĐỌC (Read-only) và xem Audit Log, bị cấm thực hiện hành động sửa đổi/ghi: "${action}"!`
        );
      }
    }
  }

  /**
   * 5. Kỳ đã khóa (LOCKED) không ai sửa được; mở khóa cần quy trình có lý do và người phê duyệt
   */
  enforceLockedPeriodProtection(
    periodStatus: PeriodStatus | string,
    isUnlockAction: boolean = false,
    unlockPayload?: { authorizedRole: RoleType | string; reason: string }
  ): void {
    if (periodStatus === PeriodStatus.LOCKED || periodStatus === 'LOCKED') {
      if (!isUnlockAction) {
        throw new BadRequestException(
          'Kỳ đánh giá này ĐÃ KHÓA (LOCKED) nhằm bảo toàn tính pháp lý của hồ sơ. Mọi hành vi sửa đổi dữ liệu KPI và kết quả đều bị chặn!'
        );
      }

      // Kiểm tra quy trình mở khóa
      if (!unlockPayload) {
        throw new BadRequestException('Yêu cầu mở khóa kỳ bắt buộc phải có thẩm quyền và lý do giải trình.');
      }

      const isExecutive =
        unlockPayload.authorizedRole === RoleType.EXECUTIVE ||
        unlockPayload.authorizedRole === RoleType.SYSTEM_ADMIN ||
        unlockPayload.authorizedRole === 'EXECUTIVE';

      if (!isExecutive) {
        throw new ForbiddenException(
          'Chỉ Lãnh đạo cấp cao (EXECUTIVE / Người đứng đầu cơ quan) mới có thẩm quyền ký quyết định mở khóa kỳ đánh giá!'
        );
      }

      if (!unlockPayload.reason || unlockPayload.reason.trim().length < 15) {
        throw new BadRequestException(
          'Lý do mở khóa kỳ đánh giá là BẮT BUỘC và phải giải trình chi tiết từ 15 ký tự trở lên theo quy chế kiểm toán.'
        );
      }
    }
  }

  /**
   * 6. Điều chỉnh điểm hoặc xếp loại bắt buộc nhập lý do, lưu giá trị gốc và giá trị mới
   */
  enforceScoreAdjustmentRules(
    originalScore: number,
    adjustedScore: number,
    reason: string,
    authorizedRole: RoleType | string
  ): ScoreAdjustmentPayload {
    if (typeof originalScore !== 'number' || typeof adjustedScore !== 'number') {
      throw new BadRequestException('Điểm gốc và điểm sau điều chỉnh phải là số hợp lệ.');
    }

    if (!reason || !reason.trim() || reason.trim().length < 10) {
      throw new BadRequestException(
        'Lý do điều chỉnh điểm hoặc xếp loại là BẮT BUỘC và phải từ 10 ký tự trở lên để ghi nhận vào nhật ký kiểm toán.'
      );
    }

    const isAllowedRole = [
      RoleType.EXECUTIVE,
      RoleType.UNIT_HEAD,
      'EXECUTIVE',
      'UNIT_HEAD',
      RoleType.SYSTEM_ADMIN,
    ].includes(authorizedRole as any);

    if (!isAllowedRole) {
      throw new ForbiddenException(
        'Chỉ Người đứng đầu cơ quan (EXECUTIVE) hoặc Trưởng đơn vị (UNIT_HEAD) mới có thẩm quyền điều chỉnh kết quả đánh giá.'
      );
    }

    const diff = Math.round((adjustedScore - originalScore) * 10) / 10;

    return {
      originalScore,
      adjustedScore,
      reason: reason.trim(),
      authorizedRole,
      diff,
    };
  }
}
