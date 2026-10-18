import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import {
  OperatingMode,
  EvaluationStatus,
  GovClassification,
  RoleType,
} from '../../common/enums';

export interface WorkflowTransitionInput {
  currentStatus: EvaluationStatus | string;
  nextStatus: EvaluationStatus | string;
  userRole: RoleType | string;
  operatingMode: OperatingMode | string;
  isOwner?: boolean;
}

export interface DisciplinaryExclusionInput {
  score: number;
  hasDiscipline: boolean;
  disciplineType?: string; // 'KHIEN_TRACH', 'CANH_CAO', 'CACH_CHUC', 'BUOC_THOI_VIEC'
  operatingMode?: OperatingMode | string;
}

export interface ScoreAdjustmentInput {
  originalScore: number;
  originalClassification: string;
  adjustedScore: number;
  adjustedClassification: string;
  reason: string;
  authorizedRole: RoleType | string;
}

export interface QuotaCheckResult {
  isWithinQuota: boolean;
  excellentCount: number;
  totalEvaluated: number;
  excellentPercentage: number;
  maxAllowedExcellent: number;
  policy: 'WARNING_WITH_JUSTIFICATION' | 'STRICT_BLOCK';
  message: string;
}

@Injectable()
export class WorkflowStateMachineService {
  private readonly logger = new Logger(WorkflowStateMachineService.name);

  /**
   * Kiểm tra tính hợp lệ của luồng chuyển trạng thái (State Machine Transitions)
   * và phân quyền theo từng vai trò (RBAC) cho cả 2 chế độ Nhà nước & Doanh nghiệp
   */
  validateTransition(input: WorkflowTransitionInput): { isValid: boolean; message: string } {
    const { currentStatus, nextStatus, userRole, operatingMode, isOwner } = input;

    // --------------------------------------------------------------------------
    // A. LUỒNG CHẾ ĐỘ NHÀ NƯỚC (Nghị định 90/2020 & NĐ 48/2023)
    // DRAFT -> SELF_EVALUATED -> COLLECTIVE_REVIEW -> MANAGER_ASSESSED -> COUNCIL_APPRAISED -> HEAD_APPROVED -> PUBLISHED -> LOCKED
    // --------------------------------------------------------------------------
    if (operatingMode === OperatingMode.GOVERNMENT || operatingMode === 'GOVERNMENT') {
      const govTransitions: Record<string, { next: string[]; allowedRoles: string[]; requiresOwner?: boolean }> = {
        [EvaluationStatus.DRAFT]: {
          next: [EvaluationStatus.SELF_EVALUATED],
          allowedRoles: [RoleType.EMPLOYEE, RoleType.DEPT_HEAD, RoleType.SUPER_ADMIN],
          requiresOwner: true,
        },
        [EvaluationStatus.SELF_EVALUATED]: {
          next: [EvaluationStatus.COLLECTIVE_REVIEW, EvaluationStatus.REJECTED],
          allowedRoles: [RoleType.DEPT_HEAD, RoleType.SUPER_ADMIN, RoleType.HR_ADMIN],
        },
        [EvaluationStatus.COLLECTIVE_REVIEW]: {
          next: [EvaluationStatus.MANAGER_ASSESSED, EvaluationStatus.REJECTED],
          allowedRoles: [RoleType.DEPT_HEAD, RoleType.SUPER_ADMIN],
        },
        [EvaluationStatus.MANAGER_ASSESSED]: {
          next: [EvaluationStatus.COUNCIL_APPRAISED, EvaluationStatus.HEAD_APPROVED],
          allowedRoles: [RoleType.DEPT_HEAD, RoleType.COUNCIL_MEMBER, RoleType.HEAD_OF_AGENCY, RoleType.SUPER_ADMIN],
        },
        [EvaluationStatus.COUNCIL_APPRAISED]: {
          next: [EvaluationStatus.HEAD_APPROVED],
          allowedRoles: [RoleType.HEAD_OF_AGENCY, RoleType.SUPER_ADMIN],
        },
        [EvaluationStatus.HEAD_APPROVED]: {
          next: [EvaluationStatus.PUBLISHED],
          allowedRoles: [RoleType.HEAD_OF_AGENCY, RoleType.HR_ADMIN, RoleType.SUPER_ADMIN],
        },
        [EvaluationStatus.PUBLISHED]: {
          next: [EvaluationStatus.DRAFT], // Khiếu nại/giải trình -> hoàn về draft
          allowedRoles: [RoleType.SUPER_ADMIN, RoleType.HEAD_OF_AGENCY],
        },
      };

      const rule = govTransitions[currentStatus];
      if (!rule) {
        throw new BadRequestException(`Trạng thái hiện tại "${currentStatus}" không hỗ trợ chuyển đổi tiếp.`);
      }

      if (!rule.next.includes(nextStatus as string)) {
        throw new BadRequestException(
          `Không thể chuyển trạng thái từ "${currentStatus}" sang "${nextStatus}" trong quy trình Nhà nước (NĐ 90/2020).`
        );
      }

      const roleAllowed =
        rule.allowedRoles.includes(userRole as string) || userRole === RoleType.SUPER_ADMIN;

      if (!roleAllowed) {
        throw new ForbiddenException(
          `Vai trò "${userRole}" không có thẩm quyền thực hiện chuyển bước sang "${nextStatus}".`
        );
      }

      return { isValid: true, message: 'Chuyển trạng thái quy trình Nhà nước hợp lệ.' };
    }

    // --------------------------------------------------------------------------
    // B. LUỒNG CHẾ ĐỘ DOANH NGHIỆP (KPI / OKR / BSC / 360)
    // DRAFT -> SELF_EVALUATED -> MANAGER_ASSESSED -> HEAD_APPROVED -> PUBLISHED -> LOCKED
    // --------------------------------------------------------------------------
    const entTransitions: Record<string, { next: string[]; allowedRoles: string[] }> = {
      [EvaluationStatus.DRAFT]: {
        next: [EvaluationStatus.SELF_EVALUATED],
        allowedRoles: [RoleType.EMPLOYEE, RoleType.DEPT_HEAD, RoleType.SUPER_ADMIN],
      },
      [EvaluationStatus.SELF_EVALUATED]: {
        next: [EvaluationStatus.MANAGER_ASSESSED, EvaluationStatus.REJECTED],
        allowedRoles: [RoleType.DEPT_HEAD, RoleType.SUPER_ADMIN],
      },
      [EvaluationStatus.MANAGER_ASSESSED]: {
        next: [EvaluationStatus.HEAD_APPROVED, EvaluationStatus.PUBLISHED],
        allowedRoles: [RoleType.HEAD_OF_AGENCY, RoleType.SUPER_ADMIN],
      },
      [EvaluationStatus.HEAD_APPROVED]: {
        next: [EvaluationStatus.PUBLISHED],
        allowedRoles: [RoleType.HEAD_OF_AGENCY, RoleType.HR_ADMIN, RoleType.SUPER_ADMIN],
      },
    };

    const entRule = entTransitions[currentStatus];
    if (!entRule || !entRule.next.includes(nextStatus as string)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ "${currentStatus}" sang "${nextStatus}" trong quy trình Doanh nghiệp.`
      );
    }

    const entRoleAllowed =
      entRule.allowedRoles.includes(userRole as string) || userRole === RoleType.SUPER_ADMIN;

    if (!entRoleAllowed) {
      throw new ForbiddenException(
        `Vai trò "${userRole}" không được phép chuyển trạng thái đánh giá sang "${nextStatus}".`
      );
    }

    return { isValid: true, message: 'Chuyển trạng thái quy trình Doanh nghiệp hợp lệ.' };
  }

  /**
   * Đánh giá người đứng đầu đơn vị: Bổ sung tiêu chí kết quả hoàn thành của đơn vị
   * Formula: Final = (Individual * individualWeight) + (DeptCompletion * deptWeight)
   */
  evaluateLeaderWithDepartmentWeight(
    individualScore: number,
    departmentCompletionRate: number,
    deptWeight: number = 0.7
  ): {
    individualScore: number;
    departmentCompletionRate: number;
    combinedScore: number;
    deptWeight: number;
    individualWeight: number;
  } {
    const indWeight = Math.round((1 - deptWeight) * 100) / 100;
    const combined = Math.round((individualScore * indWeight + departmentCompletionRate * deptWeight) * 10) / 10;

    return {
      individualScore,
      departmentCompletionRate,
      combinedScore: combined,
      deptWeight,
      individualWeight: indWeight,
    };
  }

  /**
   * Đề xuất xếp loại tự động kèm điều kiện loại trừ kỷ luật:
   * Nếu có kỷ luật (Khiển trách, Cảnh cáo) => Giới hạn mức xếp loại trần không quá "Hoàn thành nhiệm vụ"
   */
  classifyWithExclusions(input: DisciplinaryExclusionInput): {
    classification: GovClassification | string;
    isRestricted: boolean;
    restrictionReason?: string;
    score: number;
  } {
    const { score, hasDiscipline, disciplineType } = input;

    // Phân loại cơ bản theo thang điểm Nghị định 90:
    // >= 90: Xuất sắc, 80-89: Tốt, 65-79: Hoàn thành, < 65: Không hoàn thành
    let baseClassification: GovClassification;
    if (score >= 90) baseClassification = GovClassification.HOAN_THANH_XUAT_SAC;
    else if (score >= 80) baseClassification = GovClassification.HOAN_THANH_TOT;
    else if (score >= 65) baseClassification = GovClassification.HOAN_THANH;
    else baseClassification = GovClassification.KHONG_HOAN_THANH;

    // Kiểm tra điều kiện kỷ luật (Nghị định 90/2020/NĐ-CP Điều 7, 8, 9, 10)
    if (hasDiscipline) {
      if (
        baseClassification === GovClassification.HOAN_THANH_XUAT_SAC ||
        baseClassification === GovClassification.HOAN_THANH_TOT
      ) {
        return {
          classification: GovClassification.HOAN_THANH,
          isRestricted: true,
          restrictionReason: `Cán bộ bị xử lý kỷ luật (${disciplineType || 'KHIỂN TRÁCH'}). Theo quy định không được xếp loại Xuất sắc hoặc Tốt; giới hạn tối đa ở mức Hoàn thành nhiệm vụ.`,
          score,
        };
      }
    }

    return {
      classification: baseClassification,
      isRestricted: false,
      score,
    };
  }

  /**
   * Hiệu chỉnh điểm của Người đứng đầu (có thẩm quyền)
   * Yêu cầu BẮT BUỘC phải nhập lý do giải trình
   */
  adjustScoreWithReason(input: ScoreAdjustmentInput): {
    success: boolean;
    auditEntry: {
      originalScore: number;
      originalClassification: string;
      adjustedScore: number;
      adjustedClassification: string;
      reason: string;
      adjustedByRole: string;
      adjustedAt: string;
    };
  } {
    const { originalScore, originalClassification, adjustedScore, adjustedClassification, reason, authorizedRole } = input;

    if (!reason || !reason.trim() || reason.trim().length < 10) {
      throw new BadRequestException('Lý do điều chỉnh kết quả đánh giá là BẮT BUỘC và phải từ 10 ký tự trở lên theo quy định kiểm toán.');
    }

    const allowed = [RoleType.HEAD_OF_AGENCY, RoleType.SUPER_ADMIN, RoleType.DEPT_HEAD].includes(authorizedRole as RoleType);
    if (!allowed) {
      throw new ForbiddenException('Chỉ Người đứng đầu cơ quan hoặc Trưởng đơn vị mới có thẩm quyền điều chỉnh kết quả.');
    }

    return {
      success: true,
      auditEntry: {
        originalScore,
        originalClassification,
        adjustedScore,
        adjustedClassification,
        reason: reason.trim(),
        adjustedByRole: authorizedRole as string,
        adjustedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Kiểm soát tỷ lệ mức xếp loại Xuất sắc không quá 20% (Điều 20 NĐ 90/2020)
   */
  checkQuotaEnforcement(
    currentExcellentCount: number,
    totalEvaluated: number,
    policy: 'WARNING_WITH_JUSTIFICATION' | 'STRICT_BLOCK' = 'WARNING_WITH_JUSTIFICATION'
  ): QuotaCheckResult {
    const rate = totalEvaluated > 0 ? (currentExcellentCount / totalEvaluated) * 100 : 0;
    const roundedRate = Math.round(rate * 10) / 10;
    const maxAllowed = Math.floor(totalEvaluated * 0.20);
    const isWithinQuota = currentExcellentCount <= maxAllowed || roundedRate <= 20.0;

    let message = `Tỷ lệ Hoàn thành xuất sắc hiện tại là ${roundedRate}% (${currentExcellentCount}/${totalEvaluated} cán bộ) - Đạt chuẩn khống chế tối đa 20%.`;
    if (!isWithinQuota) {
      message = `Tỷ lệ Hoàn thành xuất sắc là ${roundedRate}% (vượt ngưỡng trần 20% theo NĐ 90/2020, tối đa chỉ được ${maxAllowed} cán bộ).`;
      if (policy === 'STRICT_BLOCK') {
        throw new BadRequestException(`${message} Hệ thống đang áp dụng chính sách CHẶN CỨNG; vui lòng điều chỉnh lại.`);
      }
    }

    return {
      isWithinQuota,
      excellentCount: currentExcellentCount,
      totalEvaluated,
      excellentPercentage: roundedRate,
      maxAllowedExcellent: maxAllowed,
      policy,
      message,
    };
  }
}
