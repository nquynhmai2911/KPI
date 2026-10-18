import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePeriodDto, LockPeriodDto, UnlockPeriodDto } from './dto/period.dto';
import { PeriodStatus, RoleType, AuditAction } from '../../common/enums';

@Injectable()
export class PeriodService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy danh sách các kỳ đánh giá
   */
  async findAll() {
    return this.prisma.assessmentPeriod.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { evaluations: true, templates: true },
        },
      },
    });
  }

  /**
   * Xem chi tiết một kỳ đánh giá kèm lịch sử khóa/mở khóa
   */
  async findOne(id: string) {
    const period = await this.prisma.assessmentPeriod.findUnique({
      where: { id },
      include: {
        lockHistories: {
          orderBy: { createdAt: 'desc' },
          include: {
            authorizedBy: {
              select: { id: true, fullName: true, username: true },
            },
          },
        },
        templates: true,
        _count: {
          select: { evaluations: true },
        },
      },
    });

    if (!period) {
      throw new NotFoundException(`Không tìm thấy kỳ đánh giá với ID: ${id}`);
    }

    return period;
  }

  /**
   * Tạo mới kỳ đánh giá
   */
  async create(dto: CreatePeriodDto) {
    const existing = await this.prisma.assessmentPeriod.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(`Mã kỳ đánh giá '${dto.code}' đã tồn tại`);
    }

    return this.prisma.assessmentPeriod.create({
      data: {
        code: dto.code,
        name: dto.name,
        periodType: dto.periodType,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        evaluationDeadline: new Date(dto.evaluationDeadline),
        operatingMode: dto.operatingMode,
        rulesConfig: dto.rulesConfig || {
          maxExcellentPercentage: 20,
          quotaPolicy: 'WARNING_WITH_JUSTIFICATION',
        },
        weightMatrix: dto.weightMatrix || {
          SELF: 10,
          DIRECT_MANAGER: 60,
          COLLECTIVE_PEER: 30,
        },
      },
    });
  }

  /**
   * Khóa kỳ đánh giá (Đóng băng dữ liệu, bất biến)
   */
  async lockPeriod(id: string, currentUser: any, dto: LockPeriodDto) {
    const period = await this.findOne(id);

    if (period.isLocked) {
      throw new BadRequestException('Kỳ đánh giá này hiện đã ở trạng thái khóa');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái Period
      const updatedPeriod = await tx.assessmentPeriod.update({
        where: { id },
        data: {
          isLocked: true,
          status: PeriodStatus.LOCKED,
          lockedAt: new Date(),
          lockedById: currentUser.id,
        },
      });

      // 2. Khóa đồng bộ tất cả các bản ghi đánh giá cá nhân trong kỳ
      await tx.evaluationRecord.updateMany({
        where: { periodId: id },
        data: { isLocked: true },
      });

      // 3. Ghi vết lịch sử khóa kỳ
      await tx.periodLockHistory.create({
        data: {
          periodId: id,
          isLocked: true,
          reason: dto.reason,
          authorizedById: currentUser.id,
        },
      });

      // 4. Ghi Audit Log bắt buộc
      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          username: currentUser.username,
          action: AuditAction.LOCK_PERIOD,
          entityName: 'AssessmentPeriod',
          entityId: id,
          newValues: { isLocked: true, status: PeriodStatus.LOCKED },
          reason: dto.reason,
        },
      });

      return updatedPeriod;
    });
  }

  /**
   * Mở khóa kỳ đánh giá (Yêu cầu quyền đặc biệt + Lý do giải trình bắt buộc)
   */
  async unlockPeriod(id: string, currentUser: any, dto: UnlockPeriodDto) {
    const period = await this.findOne(id);

    if (!period.isLocked) {
      throw new BadRequestException('Kỳ đánh giá đang mở, không cần thao tác mở khóa');
    }

    // Kiểm tra quyền đặc biệt: Phải là SUPER_ADMIN hoặc HEAD_OF_AGENCY hoặc HR_ADMIN
    const allowedRoles: RoleType[] = [RoleType.SUPER_ADMIN, RoleType.HEAD_OF_AGENCY, RoleType.HR_ADMIN];
    const hasPrivilege = currentUser.roles.some((r: RoleType) => allowedRoles.includes(r));

    if (!hasPrivilege) {
      throw new ForbiddenException('Chỉ Lãnh đạo cấp cao hoặc Quản trị viên mới có thẩm quyền mở khóa kỳ đánh giá');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Mở khóa Period
      const updatedPeriod = await tx.assessmentPeriod.update({
        where: { id },
        data: {
          isLocked: false,
          status: PeriodStatus.REVIEWING,
          lockedAt: null,
          lockedById: null,
        },
      });

      // 2. Mở khóa các phiếu đánh giá
      await tx.evaluationRecord.updateMany({
        where: { periodId: id },
        data: { isLocked: false },
      });

      // 3. Ghi vết lịch sử mở khóa
      await tx.periodLockHistory.create({
        data: {
          periodId: id,
          isLocked: false,
          reason: dto.reason,
          authorizedById: currentUser.id,
        },
      });

      // 4. Ghi Audit Log bắt buộc
      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          username: currentUser.username,
          action: AuditAction.UNLOCK_PERIOD,
          entityName: 'AssessmentPeriod',
          entityId: id,
          oldValues: { isLocked: true, status: PeriodStatus.LOCKED },
          newValues: { isLocked: false, status: PeriodStatus.REVIEWING },
          reason: dto.reason,
        },
      });

      return updatedPeriod;
    });
  }
}
