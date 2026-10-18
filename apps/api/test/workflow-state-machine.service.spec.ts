import { WorkflowStateMachineService } from '../src/modules/kpi/workflow-state-machine.service';
import { OperatingMode, EvaluationStatus, GovClassification, RoleType } from '../src/common/enums';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('WorkflowStateMachineService (Quy trình Đánh giá & State Machine)', () => {
  let service: WorkflowStateMachineService;

  beforeEach(() => {
    service = new WorkflowStateMachineService();
  });

  describe('Luồng Chuyển Trạng thái Chế độ Nhà nước (NĐ 90/2020 & NĐ 48/2023)', () => {
    it('Nhân viên tự đánh giá: DRAFT -> SELF_EVALUATED', () => {
      const result = service.validateTransition({
        currentStatus: EvaluationStatus.DRAFT,
        nextStatus: EvaluationStatus.SELF_EVALUATED,
        userRole: RoleType.EMPLOYEE,
        operatingMode: OperatingMode.GOVERNMENT,
        isOwner: true,
      });
      expect(result.isValid).toBe(true);
    });

    it('Trưởng đơn vị chuyển sang Hội nghị tập thể: SELF_EVALUATED -> COLLECTIVE_REVIEW', () => {
      const result = service.validateTransition({
        currentStatus: EvaluationStatus.SELF_EVALUATED,
        nextStatus: EvaluationStatus.COLLECTIVE_REVIEW,
        userRole: RoleType.DEPT_HEAD,
        operatingMode: OperatingMode.GOVERNMENT,
      });
      expect(result.isValid).toBe(true);
    });

    it('Quản lý đánh giá sau hội nghị: COLLECTIVE_REVIEW -> MANAGER_ASSESSED', () => {
      const result = service.validateTransition({
        currentStatus: EvaluationStatus.COLLECTIVE_REVIEW,
        nextStatus: EvaluationStatus.MANAGER_ASSESSED,
        userRole: RoleType.DEPT_HEAD,
        operatingMode: OperatingMode.GOVERNMENT,
      });
      expect(result.isValid).toBe(true);
    });

    it('Hội đồng thẩm định hoặc Người đứng đầu phê duyệt: MANAGER_ASSESSED -> HEAD_APPROVED', () => {
      const result = service.validateTransition({
        currentStatus: EvaluationStatus.MANAGER_ASSESSED,
        nextStatus: EvaluationStatus.HEAD_APPROVED,
        userRole: RoleType.HEAD_OF_AGENCY,
        operatingMode: OperatingMode.GOVERNMENT,
      });
      expect(result.isValid).toBe(true);
    });

    it('Công bố kết quả: HEAD_APPROVED -> PUBLISHED', () => {
      const result = service.validateTransition({
        currentStatus: EvaluationStatus.HEAD_APPROVED,
        nextStatus: EvaluationStatus.PUBLISHED,
        userRole: RoleType.HR_ADMIN,
        operatingMode: OperatingMode.GOVERNMENT,
      });
      expect(result.isValid).toBe(true);
    });

    it('Chặn chuyển sai thứ tự trạng thái (DRAFT -> HEAD_APPROVED)', () => {
      expect(() =>
        service.validateTransition({
          currentStatus: EvaluationStatus.DRAFT,
          nextStatus: EvaluationStatus.HEAD_APPROVED,
          userRole: RoleType.HEAD_OF_AGENCY,
          operatingMode: OperatingMode.GOVERNMENT,
        })
      ).toThrow(BadRequestException);
    });

    it('Chặn nhân viên không có thẩm quyền duyệt hội nghị tập thể', () => {
      expect(() =>
        service.validateTransition({
          currentStatus: EvaluationStatus.COLLECTIVE_REVIEW,
          nextStatus: EvaluationStatus.MANAGER_ASSESSED,
          userRole: RoleType.EMPLOYEE,
          operatingMode: OperatingMode.GOVERNMENT,
        })
      ).toThrow(ForbiddenException);
    });
  });

  describe('Luồng Chuyển Trạng thái Chế độ Doanh nghiệp (KPI / 360 / BSC)', () => {
    it('Chuyển tuần tự DRAFT -> SELF_EVALUATED -> MANAGER_ASSESSED -> HEAD_APPROVED -> PUBLISHED', () => {
      expect(
        service.validateTransition({
          currentStatus: EvaluationStatus.DRAFT,
          nextStatus: EvaluationStatus.SELF_EVALUATED,
          userRole: RoleType.EMPLOYEE,
          operatingMode: OperatingMode.ENTERPRISE,
        }).isValid
      ).toBe(true);

      expect(
        service.validateTransition({
          currentStatus: EvaluationStatus.SELF_EVALUATED,
          nextStatus: EvaluationStatus.MANAGER_ASSESSED,
          userRole: RoleType.DEPT_HEAD,
          operatingMode: OperatingMode.ENTERPRISE,
        }).isValid
      ).toBe(true);

      expect(
        service.validateTransition({
          currentStatus: EvaluationStatus.MANAGER_ASSESSED,
          nextStatus: EvaluationStatus.HEAD_APPROVED,
          userRole: RoleType.HEAD_OF_AGENCY,
          operatingMode: OperatingMode.ENTERPRISE,
        }).isValid
      ).toBe(true);
    });

    it('Từ chối bước không thuộc quy trình doanh nghiệp (COLLECTIVE_REVIEW)', () => {
      expect(() =>
        service.validateTransition({
          currentStatus: EvaluationStatus.SELF_EVALUATED,
          nextStatus: EvaluationStatus.COLLECTIVE_REVIEW,
          userRole: RoleType.DEPT_HEAD,
          operatingMode: OperatingMode.ENTERPRISE,
        })
      ).toThrow(BadRequestException);
    });
  });

  describe('Đánh giá Người đứng đầu đơn vị (evaluateLeaderWithDepartmentWeight)', () => {
    it('Kết hợp trọng số: 30% cá nhân + 70% kết quả đơn vị', () => {
      const individualScore = 95;
      const deptCompletionRate = 80;
      // Expected = 95 * 0.3 + 80 * 0.7 = 28.5 + 56 = 84.5
      const result = service.evaluateLeaderWithDepartmentWeight(individualScore, deptCompletionRate, 0.7);

      expect(result.combinedScore).toBe(84.5);
      expect(result.deptWeight).toBe(0.7);
      expect(result.individualWeight).toBe(0.3);
    });

    it('Xử lý trường hợp cá nhân điểm cao (100) nhưng đơn vị yếu (60)', () => {
      // Expected = 100 * 0.3 + 60 * 0.7 = 30 + 42 = 72
      const result = service.evaluateLeaderWithDepartmentWeight(100, 60, 0.7);
      expect(result.combinedScore).toBe(72);
    });
  });

  describe('Xếp loại tự động & Điều kiện Loại trừ Kỷ luật (classifyWithExclusions)', () => {
    it('Không có kỷ luật, điểm >= 90 => Hoàn thành xuất sắc nhiệm vụ', () => {
      const result = service.classifyWithExclusions({
        score: 94,
        hasDiscipline: false,
      });
      expect(result.classification).toBe(GovClassification.HOAN_THANH_XUAT_SAC);
      expect(result.isRestricted).toBe(false);
    });

    it('Không có kỷ luật, điểm 85 => Hoàn thành tốt nhiệm vụ', () => {
      const result = service.classifyWithExclusions({
        score: 85,
        hasDiscipline: false,
      });
      expect(result.classification).toBe(GovClassification.HOAN_THANH_TOT);
      expect(result.isRestricted).toBe(false);
    });

    it('Có kỷ luật khiển trách, điểm 96 => Giới hạn trần ở mức Hoàn thành nhiệm vụ', () => {
      const result = service.classifyWithExclusions({
        score: 96,
        hasDiscipline: true,
        disciplineType: 'KHIEN_TRACH',
      });
      expect(result.classification).toBe(GovClassification.HOAN_THANH);
      expect(result.isRestricted).toBe(true);
      expect(result.restrictionReason).toContain('kỷ luật');
    });

    it('Có kỷ luật cảnh cáo, điểm 82 => Giới hạn trần ở mức Hoàn thành nhiệm vụ', () => {
      const result = service.classifyWithExclusions({
        score: 82,
        hasDiscipline: true,
        disciplineType: 'CANH_CAO',
      });
      expect(result.classification).toBe(GovClassification.HOAN_THANH);
      expect(result.isRestricted).toBe(true);
    });

    it('Điểm < 65 => Không hoàn thành nhiệm vụ', () => {
      const result = service.classifyWithExclusions({
        score: 55,
        hasDiscipline: false,
      });
      expect(result.classification).toBe(GovClassification.KHONG_HOAN_THANH);
    });
  });

  describe('Điều chỉnh điểm & Kiểm toán giải trình (adjustScoreWithReason)', () => {
    it('Người đứng đầu điều chỉnh có lý do hợp lệ (>= 10 ký tự) => Thành công và lưu audit log', () => {
      const result = service.adjustScoreWithReason({
        originalScore: 84,
        originalClassification: 'HOAN_THANH_TOT',
        adjustedScore: 92,
        adjustedClassification: 'HOAN_THANH_XUAT_SAC',
        reason: 'Có sáng kiến cải tiến quy trình công tác được cấp thẩm quyền công nhận',
        authorizedRole: RoleType.HEAD_OF_AGENCY,
      });

      expect(result.success).toBe(true);
      expect(result.auditEntry.originalScore).toBe(84);
      expect(result.auditEntry.adjustedScore).toBe(92);
      expect(result.auditEntry.reason).toContain('sáng kiến');
      expect(result.auditEntry.adjustedByRole).toBe(RoleType.HEAD_OF_AGENCY);
    });

    it('Từ chối khi lý do để trống hoặc < 10 ký tự', () => {
      expect(() =>
        service.adjustScoreWithReason({
          originalScore: 84,
          originalClassification: 'HOAN_THANH_TOT',
          adjustedScore: 92,
          adjustedClassification: 'HOAN_THANH_XUAT_SAC',
          reason: 'Ngắn',
          authorizedRole: RoleType.HEAD_OF_AGENCY,
        })
      ).toThrow(BadRequestException);

      expect(() =>
        service.adjustScoreWithReason({
          originalScore: 84,
          originalClassification: 'HOAN_THANH_TOT',
          adjustedScore: 92,
          adjustedClassification: 'HOAN_THANH_XUAT_SAC',
          reason: '   ',
          authorizedRole: RoleType.HEAD_OF_AGENCY,
        })
      ).toThrow(BadRequestException);
    });

    it('Từ chối khi vai trò không có thẩm quyền (EMPLOYEE)', () => {
      expect(() =>
        service.adjustScoreWithReason({
          originalScore: 84,
          originalClassification: 'HOAN_THANH_TOT',
          adjustedScore: 92,
          adjustedClassification: 'HOAN_THANH_XUAT_SAC',
          reason: 'Cán bộ tự xin nâng điểm vì nỗ lực cao trong quý vừa qua',
          authorizedRole: RoleType.EMPLOYEE,
        })
      ).toThrow(ForbiddenException);
    });
  });

  describe('Kiểm soát tỷ lệ Xuất sắc <= 20% (checkQuotaEnforcement)', () => {
    it('Tỷ lệ Xuất sắc đạt chuẩn (1/10 = 10% <= 20%)', () => {
      const result = service.checkQuotaEnforcement(1, 10);
      expect(result.isWithinQuota).toBe(true);
      expect(result.excellentPercentage).toBe(10);
      expect(result.maxAllowedExcellent).toBe(2);
    });

    it('Tỷ lệ Xuất sắc vượt trần (3/10 = 30% > 20%) ở chế độ CẢNH BÁO (WARNING_WITH_JUSTIFICATION)', () => {
      const result = service.checkQuotaEnforcement(3, 10, 'WARNING_WITH_JUSTIFICATION');
      expect(result.isWithinQuota).toBe(false);
      expect(result.excellentPercentage).toBe(30);
      expect(result.message).toContain('vượt ngưỡng trần 20%');
    });

    it('Tỷ lệ Xuất sắc vượt trần ở chế độ CHẶN CỨNG (STRICT_BLOCK) => Ném BadRequestException', () => {
      expect(() =>
        service.checkQuotaEnforcement(3, 10, 'STRICT_BLOCK')
      ).toThrow(BadRequestException);
    });
  });
});
