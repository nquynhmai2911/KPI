import { KpiService } from '../src/modules/kpi/kpi.service';
import { KpiScoringService } from '../src/modules/kpi/kpi-scoring.service';
import { KpiAssignmentStatus, AuditAction } from '../src/common/enums';
import { BadRequestException } from '@nestjs/common';

describe('KpiService (Quy trình Giao, Duyệt, Khóa & Điều chỉnh KPI)', () => {
  let service: KpiService;
  let scoringService: KpiScoringService;
  let mockPrisma: any;

  beforeEach(() => {
    scoringService = new KpiScoringService();

    mockPrisma = {
      kpiLibrary: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn((args) => Promise.resolve({ id: 'lib-01', ...args.data })),
        update: jest.fn((args) => Promise.resolve({ id: args.where.id, ...args.data })),
      },
      kpiAssignment: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn((args) => Promise.resolve({ id: 'asn-01', ...args.data })),
        update: jest.fn((args) => Promise.resolve({ id: args.where.id, ...args.data })),
      },
      kpiAssignmentItem: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
      },
      kpiRevisionHistory: {
        create: jest.fn((args) => Promise.resolve({ id: 'rev-01', ...args.data })),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-01' }),
      },
    };

    service = new KpiService(mockPrisma as any, scoringService);
  });

  describe('Tạo và lưu Bảng giao KPI (createOrUpdateAssignment)', () => {
    it('Chặn lưu bảng giao khi tổng trọng số khác 100%', async () => {
      const invalidDto = {
        periodId: 'period-2026-q4',
        userId: 'usr-04',
        items: [
          { code: 'KPI-01', name: 'Mục tiêu 1', unit: '%', weight: 40, targetValue: 100 },
          { code: 'KPI-02', name: 'Mục tiêu 2', unit: '%', weight: 30, targetValue: 100 },
        ], // Tổng trọng số = 70%
      };

      await expect(
        service.createOrUpdateAssignment(invalidDto as any, 'usr-mgr')
      ).rejects.toThrow(BadRequestException);
    });

    it('Tạo bảng giao thành công khi tổng trọng số chính xác 100%', async () => {
      const validDto = {
        periodId: 'period-2026-q4',
        userId: 'usr-04',
        items: [
          { code: 'KPI-01', name: 'Mục tiêu 1', unit: '%', weight: 60, targetValue: 100 },
          { code: 'KPI-02', name: 'Mục tiêu 2', unit: '%', weight: 40, targetValue: 100 },
        ],
      };

      mockPrisma.kpiAssignment.findFirst.mockResolvedValue(null);

      const result = await service.createOrUpdateAssignment(validDto as any, 'usr-mgr');
      expect(result).toBeDefined();
      expect(mockPrisma.kpiAssignment.create).toHaveBeenCalled();
    });
  });

  describe('Luồng trạng thái Workflow (Assign -> Accept / Feedback -> Approve -> Lock)', () => {
    it('Quản lý giao KPI: Chuyển trạng thái sang ASSIGNED và ghi Audit Log', async () => {
      mockPrisma.kpiAssignment.findUnique.mockResolvedValue({
        id: 'asn-01',
        status: KpiAssignmentStatus.DRAFT,
        items: [{ weight: 100 }],
      });

      const result = await service.assignKpi('asn-01', 'usr-mgr');
      expect(result.status).toBe(KpiAssignmentStatus.ASSIGNED);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditAction.ASSIGN_KPI,
          entityId: 'asn-01',
        }),
      });
    });

    it('Nhân viên xác nhận: Chuyển trạng thái sang ACCEPTED', async () => {
      mockPrisma.kpiAssignment.findUnique.mockResolvedValue({
        id: 'asn-01',
        status: KpiAssignmentStatus.ASSIGNED,
      });

      const result = await service.acceptKpi('asn-01', 'usr-emp');
      expect(result.status).toBe(KpiAssignmentStatus.ACCEPTED);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditAction.ACCEPT_KPI,
          entityId: 'asn-01',
        }),
      });
    });

    it('Nhân viên phản hồi góp ý: Chuyển trạng thái sang FEEDBACK_REQUESTED', async () => {
      mockPrisma.kpiAssignment.findUnique.mockResolvedValue({
        id: 'asn-01',
        status: KpiAssignmentStatus.ASSIGNED,
      });

      const result = await service.requestFeedback('asn-01', 'usr-emp', {
        feedbackText: 'Đề xuất giảm chỉ tiêu KPI-01 từ 100 xuống 80 do thiếu nhân sự',
      });

      expect(result.status).toBe(KpiAssignmentStatus.FEEDBACK_REQUESTED);
    });

    it('Quản lý phê duyệt chốt: Chuyển trạng thái sang APPROVED', async () => {
      mockPrisma.kpiAssignment.findUnique.mockResolvedValue({
        id: 'asn-01',
        status: KpiAssignmentStatus.ACCEPTED,
      });

      const result = await service.approveKpi('asn-01', 'usr-mgr');
      expect(result.status).toBe(KpiAssignmentStatus.APPROVED);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditAction.APPROVE_KPI,
        }),
      });
    });

    it('Khóa bảng KPI: Chuyển trạng thái sang LOCKED', async () => {
      mockPrisma.kpiAssignment.findUnique.mockResolvedValue({
        id: 'asn-01',
        status: KpiAssignmentStatus.APPROVED,
      });

      const result = await service.lockKpi('asn-01', 'usr-admin', {
        reason: 'Hết hạn đăng ký KPI theo quy định của cơ quan',
      });

      expect(result.status).toBe(KpiAssignmentStatus.LOCKED);
    });
  });

  describe('Điều chỉnh giữa kỳ (Mid-term Revision)', () => {
    it('Bắt buộc phải có lý do điều chỉnh giữa kỳ (nếu để trống => ném lỗi)', async () => {
      const revisionDto = {
        reason: '',
        items: [{ code: 'KPI-01', name: 'Nhiệm vụ', unit: '%', weight: 100, targetValue: 100 }],
      };

      await expect(
        service.reviseKpi('asn-01', 'usr-mgr', revisionDto as any)
      ).rejects.toThrow('Lý do điều chỉnh giữa kỳ là BẮT BUỘC');
    });

    it('Lưu lại phiên bản lịch sử snapshot và tăng version khi điều chỉnh', async () => {
      mockPrisma.kpiAssignment.findUnique.mockResolvedValue({
        id: 'asn-01',
        version: 1,
        status: KpiAssignmentStatus.LOCKED,
        totalWeight: 100,
        items: [{ id: 'it-01', code: 'OLD-01', weight: 100 }],
      });

      const revisionDto = {
        reason: 'Thay đổi định hướng kinh doanh theo chỉ đạo của Tập đoàn',
        items: [
          { code: 'NEW-01', name: 'Chỉ tiêu mới 1', unit: '%', weight: 50, targetValue: 100 },
          { code: 'NEW-02', name: 'Chỉ tiêu mới 2', unit: '%', weight: 50, targetValue: 200 },
        ],
      };

      await service.reviseKpi('asn-01', 'usr-mgr', revisionDto as any);

      // Kiểm tra lưu snapshot version 1
      expect(mockPrisma.kpiRevisionHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: 1,
            reason: revisionDto.reason,
          }),
        })
      );

      // Kiểm tra cập nhật version 2
      expect(mockPrisma.kpiAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: 2,
            status: KpiAssignmentStatus.ASSIGNED,
          }),
        })
      );
    });
  });

  describe('Import KPI từ Excel với kiểm tra từng dòng (importKpiExcel)', () => {
    it('Báo lỗi chi tiết từng dòng khi dữ liệu không hợp lệ', async () => {
      const rows = [
        {
          rowNumber: 2,
          code: '', // Lỗi: Trống mã
          name: 'Chỉ tiêu 1',
          category: 'Chuyên môn',
          unit: '%',
          weight: 40,
          targetValue: 100,
        },
        {
          rowNumber: 3,
          code: 'KPI-02',
          name: '', // Lỗi: Trống tên
          category: 'Chuyên môn',
          unit: '%',
          weight: 120, // Lỗi: Trọng số > 100
          targetValue: 100,
        },
        {
          rowNumber: 4,
          code: 'KPI-03',
          name: 'Chỉ tiêu 3',
          category: 'Chuyên môn',
          unit: '', // Lỗi: Trống đơn vị tính
          weight: 20,
          targetValue: NaN, // Lỗi: Target không phải số
        },
      ];

      const result = await service.importKpiExcel(rows as any);
      expect(result.canImport).toBe(false);
      expect(result.errorCount).toBeGreaterThanOrEqual(4);
      expect(result.errors.some((e) => e.field === 'Mã KPI')).toBe(true);
      expect(result.errors.some((e) => e.field === 'Tên chỉ tiêu')).toBe(true);
      expect(result.errors.some((e) => e.field === 'Trọng số')).toBe(true);
      expect(result.errors.some((e) => e.field === 'Đơn vị tính')).toBe(true);
    });

    it('Báo lỗi khi phát hiện mã KPI bị trùng lặp trong tệp Excel', async () => {
      const rows = [
        {
          rowNumber: 2,
          code: 'KPI-DUPLICATE',
          name: 'Chỉ tiêu A',
          category: 'Chuyên môn',
          unit: '%',
          weight: 50,
          targetValue: 100,
        },
        {
          rowNumber: 3,
          code: 'KPI-DUPLICATE', // Bị trùng
          name: 'Chỉ tiêu B',
          category: 'Chuyên môn',
          unit: '%',
          weight: 50,
          targetValue: 100,
        },
      ];

      const result = await service.importKpiExcel(rows as any);
      expect(result.errors.some((e) => e.reason.includes('trùng lặp'))).toBe(true);
    });

    it('Chấp nhận khi tất cả dòng hợp lệ và tổng trọng số = 100%', async () => {
      const rows = [
        {
          rowNumber: 2,
          code: 'KPI-VALID-01',
          name: 'Chỉ tiêu A',
          category: 'Chuyên môn',
          unit: '%',
          weight: 60,
          targetValue: 100,
        },
        {
          rowNumber: 3,
          code: 'KPI-VALID-02',
          name: 'Chỉ tiêu B',
          category: 'Chuyên môn',
          unit: 'Số lượng',
          weight: 40,
          targetValue: 50,
        },
      ];

      const result = await service.importKpiExcel(rows as any);
      expect(result.canImport).toBe(true);
      expect(result.errorCount).toBe(0);
      expect(result.successCount).toBe(2);
      expect(result.weightValidation.isValid).toBe(true);
    });
  });
});
