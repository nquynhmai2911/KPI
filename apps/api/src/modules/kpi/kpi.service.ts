import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KpiScoringService } from './kpi-scoring.service';
import {
  CreateKpiLibraryDto,
  UpdateKpiLibraryDto,
  CreateKpiAssignmentDto,
  ReviseKpiAssignmentDto,
  FeedbackKpiDto,
  LockKpiDto,
  ExcelKpiRowDto,
} from './dto/kpi.dto';
import {
  KpiAssignmentStatus,
  AuditAction,
  ScoringMethod,
  TargetDirection,
  KpiType,
} from '../../common/enums';

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);

  constructor(
    private prisma: PrismaService,
    private scoringService: KpiScoringService,
  ) {}

  // ==============================================================================
  // 1. KPI LIBRARY MANAGEMENT
  // ==============================================================================

  async findAllLibrary(query: { category?: string; search?: string; departmentId?: string }) {
    const { category, search, departmentId } = query;
    const where: any = { isActive: true };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (departmentId) {
      where.OR = [{ departmentId }, { departmentId: null }];
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (this.prisma.kpiLibrary) {
      return this.prisma.kpiLibrary.findMany({
        where,
        orderBy: { code: 'asc' },
      });
    }
    return [];
  }

  async createLibraryItem(dto: CreateKpiLibraryDto) {
    if (!this.prisma.kpiLibrary) return dto;

    const existing = await this.prisma.kpiLibrary.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException(`Mã chỉ tiêu ${dto.code} đã tồn tại trong thư viện.`);
    }

    return this.prisma.kpiLibrary.create({
      data: dto as any,
    });
  }

  async updateLibraryItem(id: string, dto: UpdateKpiLibraryDto) {
    if (!this.prisma.kpiLibrary) return dto;

    const item = await this.prisma.kpiLibrary.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Không tìm thấy chỉ tiêu thư viện với ID: ${id}`);
    }

    return this.prisma.kpiLibrary.update({
      where: { id },
      data: dto as any,
    });
  }

  async deleteLibraryItem(id: string) {
    if (!this.prisma.kpiLibrary) return { success: true };

    return this.prisma.kpiLibrary.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ==============================================================================
  // 2. KPI ASSIGNMENT WORKFLOW (GIAO - XÁC NHẬN - PHẢN HỒI - DUYỆT - KHÓA)
  // ==============================================================================

  /**
   * Lấy danh sách các bảng giao KPI theo kỳ và phạm vi
   */
  async findAssignments(query: {
    periodId: string;
    departmentId?: string;
    userId?: string;
    status?: KpiAssignmentStatus;
  }) {
    if (!this.prisma.kpiAssignment) return [];

    const { periodId, departmentId, userId, status } = query;
    const where: any = { periodId };

    if (departmentId) where.departmentId = departmentId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    return this.prisma.kpiAssignment.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            employeeCode: true,
            position: { select: { id: true, name: true } },
          },
        },
        assignedBy: { select: { id: true, fullName: true } },
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { items: true, revisions: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Lấy chi tiết một bảng KPI kèm danh sách chỉ tiêu, cây cascade và lịch sử điều chỉnh
   */
  async getAssignmentById(id: string) {
    if (!this.prisma.kpiAssignment) {
      throw new NotFoundException(`Không tìm thấy bảng giao KPI với ID: ${id}`);
    }

    const assignment = await this.prisma.kpiAssignment.findUnique({
      where: { id },
      include: {
        period: true,
        department: true,
        user: {
          include: { position: true, department: true },
        },
        assignedBy: { select: { id: true, fullName: true, username: true } },
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            parentKpi: true,
            childKpis: true,
          },
        },
        revisions: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { id: true, fullName: true, username: true } },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(`Không tìm thấy bảng giao KPI với ID: ${id}`);
    }

    // Tính toán lại toàn bộ điểm và tổng trọng số hiện thời
    const calculatedAssignment = this.scoringService.calculateAssignmentTotal(
      assignment.items.map((it: any) => ({
        scoringMethod: it.scoringMethod,
        targetDirection: it.targetDirection,
        targetValue: it.targetValue,
        actualValue: it.actualValue,
        minThreshold: it.minThreshold,
        maxThreshold: it.maxThreshold,
        formulaConfig: it.formulaConfig,
        bonusPoints: it.bonusPoints,
        penaltyPoints: it.penaltyPoints,
        weight: it.weight,
      }))
    );

    return {
      ...assignment,
      scoringSummary: calculatedAssignment,
    };
  }

  /**
   * Tạo mới hoặc lưu bản nháp bảng giao KPI
   * BẮT BUỘC kiểm tra tổng trọng số = 100% trước khi cho phép giao chính thức
   */
  async createOrUpdateAssignment(dto: CreateKpiAssignmentDto, creatorId: string) {
    const { periodId, departmentId, userId, items } = dto;

    if (!departmentId && !userId) {
      throw new BadRequestException('Bảng giao KPI bắt buộc phải gán cho Đơn vị hoặc Cá nhân.');
    }

    // Kiểm tra tổng trọng số
    const weightValidation = this.scoringService.validateTotalWeight(items);
    if (!weightValidation.isValid) {
      throw new BadRequestException(
        `Không thể lưu bảng KPI: ${weightValidation.message}`
      );
    }

    if (!this.prisma.kpiAssignment) {
      return { id: 'mock-assignment-id', ...dto, totalWeight: weightValidation.totalWeight };
    }

    // Tìm xem đã tồn tại bảng giao KPI của đối tượng trong kỳ này chưa
    const existing = await this.prisma.kpiAssignment.findFirst({
      where: {
        periodId,
        ...(userId ? { userId } : { departmentId }),
      },
      include: { items: true },
    });

    if (existing) {
      if (existing.status === KpiAssignmentStatus.LOCKED) {
        throw new ForbiddenException(
          'Bảng KPI này đã bị KHÓA. Mọi thay đổi bắt buộc phải thông qua luồng Điều chỉnh giữa kỳ.'
        );
      }

      // Xóa các items cũ và tạo mới lại các items đã cập nhật
      await this.prisma.kpiAssignmentItem.deleteMany({
        where: { assignmentId: existing.id },
      });

      const updated = await this.prisma.kpiAssignment.update({
        where: { id: existing.id },
        data: {
          totalWeight: weightValidation.totalWeight,
          items: {
            create: items.map((it, idx) => ({
              parentKpiId: it.parentKpiId || null,
              kpiLibraryId: it.kpiLibraryId || null,
              code: it.code,
              name: it.name,
              description: it.description || null,
              kpiType: it.kpiType || KpiType.QUANTITATIVE,
              unit: it.unit,
              targetDirection: it.targetDirection || TargetDirection.HIGHER_IS_BETTER,
              weight: it.weight,
              targetValue: it.targetValue,
              minThreshold: it.minThreshold || null,
              maxThreshold: it.maxThreshold || null,
              scoringMethod: it.scoringMethod || ScoringMethod.LINEAR,
              formulaConfig: it.formulaConfig || null,
              sortOrder: idx + 1,
            })),
          },
        },
        include: { items: true },
      });

      return updated;
    }

    // Tạo mới bảng giao
    const created = await this.prisma.kpiAssignment.create({
      data: {
        periodId,
        departmentId: departmentId || null,
        userId: userId || null,
        assignedById: creatorId,
        status: KpiAssignmentStatus.DRAFT,
        version: 1,
        totalWeight: weightValidation.totalWeight,
        items: {
          create: items.map((it, idx) => ({
            parentKpiId: it.parentKpiId || null,
            kpiLibraryId: it.kpiLibraryId || null,
            code: it.code,
            name: it.name,
            description: it.description || null,
            kpiType: it.kpiType || KpiType.QUANTITATIVE,
            unit: it.unit,
            targetDirection: it.targetDirection || TargetDirection.HIGHER_IS_BETTER,
            weight: it.weight,
            targetValue: it.targetValue,
            minThreshold: it.minThreshold || null,
            maxThreshold: it.maxThreshold || null,
            scoringMethod: it.scoringMethod || ScoringMethod.LINEAR,
            formulaConfig: it.formulaConfig || null,
            sortOrder: idx + 1,
          })),
        },
      },
      include: { items: true },
    });

    return created;
  }

  /**
   * Quản lý Giao KPI cho nhân viên / đơn vị
   * Trạng thái chuyển sang ASSIGNED
   */
  async assignKpi(id: string, assignedById: string) {
    if (!this.prisma.kpiAssignment) return { id, status: KpiAssignmentStatus.ASSIGNED };

    const assignment = await this.prisma.kpiAssignment.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!assignment) {
      throw new NotFoundException(`Không tìm thấy bảng KPI với ID: ${id}`);
    }

    const weightCheck = this.scoringService.validateTotalWeight(assignment.items);
    if (!weightCheck.isValid) {
      throw new BadRequestException(`Không thể giao KPI: ${weightCheck.message}`);
    }

    const updated = await this.prisma.kpiAssignment.update({
      where: { id },
      data: {
        status: KpiAssignmentStatus.ASSIGNED,
        assignedById,
      },
    });

    await this.logAudit({
      userId: assignedById,
      action: AuditAction.ASSIGN_KPI,
      entityName: 'KpiAssignment',
      entityId: id,
      newValues: { status: KpiAssignmentStatus.ASSIGNED },
      reason: 'Quản lý giao chỉ tiêu KPI kỳ mới cho nhân sự/đơn vị',
    });

    return updated;
  }

  /**
   * Nhân viên Xác nhận đồng thuận nhận KPI
   * Trạng thái chuyển sang ACCEPTED
   */
  async acceptKpi(id: string, userId: string) {
    if (!this.prisma.kpiAssignment) return { id, status: KpiAssignmentStatus.ACCEPTED };

    const assignment = await this.prisma.kpiAssignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException(`Không tìm thấy bảng KPI với ID: ${id}`);

    if (assignment.status !== KpiAssignmentStatus.ASSIGNED) {
      throw new BadRequestException('Chỉ có thể xác nhận khi KPI đang ở trạng thái ĐÃ GIAO (ASSIGNED).');
    }

    const updated = await this.prisma.kpiAssignment.update({
      where: { id },
      data: { status: KpiAssignmentStatus.ACCEPTED },
    });

    await this.logAudit({
      userId,
      action: AuditAction.ACCEPT_KPI,
      entityName: 'KpiAssignment',
      entityId: id,
      newValues: { status: KpiAssignmentStatus.ACCEPTED },
      reason: 'Nhân viên đã xác nhận và cam kết hoàn thành chỉ tiêu KPI',
    });

    return updated;
  }

  /**
   * Nhân viên Phản hồi / Đề nghị điều chỉnh chỉ tiêu
   * Trạng thái chuyển sang FEEDBACK_REQUESTED
   */
  async requestFeedback(id: string, userId: string, dto: FeedbackKpiDto) {
    if (!this.prisma.kpiAssignment) return { id, status: KpiAssignmentStatus.FEEDBACK_REQUESTED, ...dto };

    const assignment = await this.prisma.kpiAssignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException(`Không tìm thấy bảng KPI với ID: ${id}`);

    const updated = await this.prisma.kpiAssignment.update({
      where: { id },
      data: {
        status: KpiAssignmentStatus.FEEDBACK_REQUESTED,
        feedbackText: dto.feedbackText,
      },
    });

    await this.logAudit({
      userId,
      action: AuditAction.UPDATE,
      entityName: 'KpiAssignment',
      entityId: id,
      newValues: { status: KpiAssignmentStatus.FEEDBACK_REQUESTED, feedbackText: dto.feedbackText },
      reason: `Nhân viên gửi ý kiến phản hồi: ${dto.feedbackText}`,
    });

    return updated;
  }

  /**
   * Quản lý Duyệt chốt chỉ tiêu KPI
   * Trạng thái chuyển sang APPROVED
   */
  async approveKpi(id: string, managerId: string) {
    if (!this.prisma.kpiAssignment) return { id, status: KpiAssignmentStatus.APPROVED };

    const assignment = await this.prisma.kpiAssignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException(`Không tìm thấy bảng KPI với ID: ${id}`);

    const updated = await this.prisma.kpiAssignment.update({
      where: { id },
      data: {
        status: KpiAssignmentStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

    await this.logAudit({
      userId: managerId,
      action: AuditAction.APPROVE_KPI,
      entityName: 'KpiAssignment',
      entityId: id,
      newValues: { status: KpiAssignmentStatus.APPROVED },
      reason: 'Quản lý phê duyệt chốt kế hoạch KPI chính thức',
    });

    return updated;
  }

  /**
   * Khóa bảng KPI (LOCKED)
   */
  async lockKpi(id: string, userId: string, dto: LockKpiDto) {
    if (!this.prisma.kpiAssignment) return { id, status: KpiAssignmentStatus.LOCKED };

    const assignment = await this.prisma.kpiAssignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException(`Không tìm thấy bảng KPI với ID: ${id}`);

    const updated = await this.prisma.kpiAssignment.update({
      where: { id },
      data: {
        status: KpiAssignmentStatus.LOCKED,
        lockedAt: new Date(),
      },
    });

    await this.logAudit({
      userId,
      action: AuditAction.LOCK_KPI,
      entityName: 'KpiAssignment',
      entityId: id,
      newValues: { status: KpiAssignmentStatus.LOCKED },
      reason: `Khóa chỉ tiêu: ${dto.reason}`,
    });

    return updated;
  }

  /**
   * ĐIỀU CHỈNH GIỮA KỲ (MID-TERM REVISION)
   * Yêu cầu nghiệp vụ: Bắt buộc có lý do điều chỉnh và lưu lại lịch sử phiên bản đầy đủ
   */
  async reviseKpi(id: string, userId: string, dto: ReviseKpiAssignmentDto) {
    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new BadRequestException('Lý do điều chỉnh giữa kỳ là BẮT BUỘC theo quy định kiểm toán.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Danh sách chỉ tiêu mới không được để trống.');
    }

    // Kiểm tra tổng trọng số các chỉ tiêu mới = 100%
    const weightValidation = this.scoringService.validateTotalWeight(dto.items);
    if (!weightValidation.isValid) {
      throw new BadRequestException(`Không thể điều chỉnh KPI: ${weightValidation.message}`);
    }

    if (!this.prisma.kpiAssignment) {
      return { id, version: 2, reason: dto.reason };
    }

    const currentAssignment = await this.prisma.kpiAssignment.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!currentAssignment) {
      throw new NotFoundException(`Không tìm thấy bảng KPI với ID: ${id}`);
    }

    const currentVersion = currentAssignment.version;
    const nextVersion = currentVersion + 1;

    // 1. Tạo bản ghi lịch sử điều chỉnh (Snapshot dữ liệu phiên bản cũ)
    await this.prisma.kpiRevisionHistory.create({
      data: {
        assignmentId: id,
        version: currentVersion,
        reason: dto.reason,
        changedById: userId,
        snapshotData: {
          assignment: {
            status: currentAssignment.status,
            totalWeight: currentAssignment.totalWeight,
            version: currentAssignment.version,
          },
          items: currentAssignment.items,
        },
      },
    });

    // 2. Xóa items cũ và chèn items phiên bản mới
    await this.prisma.kpiAssignmentItem.deleteMany({
      where: { assignmentId: id },
    });

    const updated = await this.prisma.kpiAssignment.update({
      where: { id },
      data: {
        version: nextVersion,
        totalWeight: weightValidation.totalWeight,
        status: KpiAssignmentStatus.ASSIGNED, // Sau khi điều chỉnh, chuyển lại trạng thái giao để các bên duyệt lại
        items: {
          create: dto.items.map((it, idx) => ({
            parentKpiId: it.parentKpiId || null,
            kpiLibraryId: it.kpiLibraryId || null,
            code: it.code,
            name: it.name,
            description: it.description || null,
            kpiType: it.kpiType || KpiType.QUANTITATIVE,
            unit: it.unit,
            targetDirection: it.targetDirection || TargetDirection.HIGHER_IS_BETTER,
            weight: it.weight,
            targetValue: it.targetValue,
            minThreshold: it.minThreshold || null,
            maxThreshold: it.maxThreshold || null,
            scoringMethod: it.scoringMethod || ScoringMethod.LINEAR,
            formulaConfig: it.formulaConfig || null,
            sortOrder: idx + 1,
          })),
        },
      },
      include: { items: true, revisions: true },
    });

    await this.logAudit({
      userId,
      action: AuditAction.REVISE_KPI,
      entityName: 'KpiAssignment',
      entityId: id,
      oldValues: { version: currentVersion },
      newValues: { version: nextVersion, reason: dto.reason },
      reason: `Điều chỉnh giữa kỳ (v${currentVersion} -> v${nextVersion}): ${dto.reason}`,
    });

    return updated;
  }

  // ==============================================================================
  // 3. CÂY CASCADE MỤC TIÊU (HIERARCHICAL GOAL ALIGNMENT)
  // ==============================================================================

  /**
   * Lấy cấu trúc cây cascade KPI từ cấp cao xuống cấp con
   */
  async getCascadeTree(periodId: string) {
    if (!this.prisma.kpiAssignmentItem) return [];

    const items = await this.prisma.kpiAssignmentItem.findMany({
      where: {
        assignment: { periodId },
      },
      include: {
        assignment: {
          include: {
            department: { select: { id: true, name: true, level: true } },
            user: { select: { id: true, fullName: true, employeeCode: true } },
          },
        },
        childKpis: {
          include: {
            assignment: {
              include: {
                department: { select: { id: true, name: true } },
                user: { select: { id: true, fullName: true } },
              },
            },
          },
        },
      },
    });

    // Lọc các node gốc (root KPI - không có parentKpiId)
    const rootNodes = items.filter((it: any) => !it.parentKpiId);

    const buildTree = (node: any): any => {
      const children = items.filter((child: any) => child.parentKpiId === node.id);
      return {
        id: node.id,
        code: node.code,
        name: node.name,
        targetValue: node.targetValue,
        actualValue: node.actualValue,
        unit: node.unit,
        weight: node.weight,
        scoringMethod: node.scoringMethod,
        targetDirection: node.targetDirection,
        calculatedScore: node.calculatedScore,
        owner: node.assignment?.user?.fullName || node.assignment?.department?.name || 'Chung',
        ownerType: node.assignment?.userId ? 'INDIVIDUAL' : 'DEPARTMENT',
        level: node.assignment?.department?.level || 1,
        children: children.map(buildTree),
      };
    };

    return rootNodes.map(buildTree);
  }

  // ==============================================================================
  // 4. IMPORT KPI TỪ EXCEL VỚI BÁO CÁO LỖI TỪNG DÒNG
  // ==============================================================================

  async importKpiExcel(rows: ExcelKpiRowDto[]) {
    const errors: Array<{
      rowNumber: number;
      field: string;
      value: any;
      reason: string;
    }> = [];

    const validRows: ExcelKpiRowDto[] = [];
    const seenCodes = new Set<string>();

    let totalWeight = 0;

    for (const row of rows) {
      let hasRowError = false;

      // 1. Mã KPI
      if (!row.code || row.code.trim().length === 0) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'Mã KPI',
          value: row.code,
          reason: 'Mã chỉ tiêu không được để trống.',
        });
        hasRowError = true;
      } else if (seenCodes.has(row.code.trim())) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'Mã KPI',
          value: row.code,
          reason: `Mã chỉ tiêu ${row.code} bị trùng lặp trong tệp Excel.`,
        });
        hasRowError = true;
      } else {
        seenCodes.add(row.code.trim());
      }

      // 2. Tên KPI
      if (!row.name || row.name.trim().length === 0) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'Tên chỉ tiêu',
          value: row.name,
          reason: 'Tên chỉ tiêu không được để trống.',
        });
        hasRowError = true;
      }

      // 3. Đơn vị tính
      if (!row.unit || row.unit.trim().length === 0) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'Đơn vị tính',
          value: row.unit,
          reason: 'Đơn vị tính không được để trống.',
        });
        hasRowError = true;
      }

      // 4. Trọng số
      if (typeof row.weight !== 'number' || isNaN(row.weight) || row.weight <= 0 || row.weight > 100) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'Trọng số',
          value: row.weight,
          reason: 'Trọng số phải là số lớn hơn 0 và nhỏ hơn hoặc bằng 100%.',
        });
        hasRowError = true;
      } else {
        totalWeight += row.weight;
      }

      // 5. Mục tiêu
      if (typeof row.targetValue !== 'number' || isNaN(row.targetValue)) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'Chỉ tiêu mục tiêu',
          value: row.targetValue,
          reason: 'Giá trị mục tiêu phải là số hợp lệ.',
        });
        hasRowError = true;
      }

      if (!hasRowError) {
        validRows.push(row);
      }
    }

    const weightValidation = this.scoringService.validateTotalWeight(validRows);

    return {
      totalRows: rows.length,
      successCount: validRows.length,
      errorCount: errors.length,
      errors,
      validRows,
      weightValidation,
      canImport: errors.length === 0 && weightValidation.isValid,
    };
  }

  // ==============================================================================
  // HELPER: GHI NHẬT KÝ KIỂM TOÁN TỰ ĐỘNG
  // ==============================================================================

  private async logAudit(params: {
    userId?: string;
    action: AuditAction;
    entityName: string;
    entityId: string;
    oldValues?: any;
    newValues?: any;
    reason?: string;
  }) {
    try {
      if (this.prisma.auditLog) {
        await this.prisma.auditLog.create({
          data: {
            userId: params.userId || null,
            action: params.action,
            entityName: params.entityName,
            entityId: params.entityId,
            oldValues: params.oldValues || null,
            newValues: params.newValues || null,
            reason: params.reason || null,
          },
        });
      }
    } catch (err) {
      this.logger.error(`Lỗi khi ghi audit log: ${err.message}`);
    }
  }
}
