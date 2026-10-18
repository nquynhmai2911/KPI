import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { OperatingMode } from '../../common/enums';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy cấu trúc Cây đơn vị phân cấp hoàn chỉnh (Org Tree)
   */
  async getDepartmentTree(operatingMode?: OperatingMode, rootPath?: string) {
    const where: any = { isActive: true };
    if (operatingMode) where.operatingMode = operatingMode;
    if (rootPath) where.path = { startsWith: rootPath };

    const departments = await this.prisma.department.findMany({
      where,
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
      include: {
        positions: true,
        _count: { select: { users: true } },
      },
    });

    return this.buildTree(departments, rootPath ? departments[0]?.parentId : null);
  }

  private buildTree(items: any[], parentId: string | null = null): any[] {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        ...item,
        headcount: item._count?.users || item.headcount,
        children: this.buildTree(items, item.id),
      }));
  }

  /**
   * Lấy danh sách phẳng tất cả phòng ban
   */
  async findAll(query?: { operatingMode?: OperatingMode; search?: string }) {
    const where: any = { isActive: true };
    if (query?.operatingMode) where.operatingMode = query.operatingMode;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.department.findMany({
      where,
      orderBy: { path: 'asc' },
      include: {
        positions: true,
        _count: { select: { users: true } },
      },
    });
  }

  /**
   * Lấy chi tiết một đơn vị
   */
  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        positions: true,
        users: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            position: true,
            roles: { include: { role: true } },
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Không tìm thấy đơn vị với ID: ${id}`);
    }

    return department;
  }

  /**
   * Tạo mới đơn vị với đường dẫn phân cấp (Path-based tree)
   */
  async create(dto: CreateDepartmentDto) {
    const existingCode = await this.prisma.department.findUnique({ where: { code: dto.code } });
    if (existingCode) {
      throw new BadRequestException(`Mã đơn vị '${dto.code}' đã tồn tại trong hệ thống`);
    }

    let calculatedPath = `/${dto.code}`;
    if (dto.parentId) {
      const parent = await this.prisma.department.findUnique({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException(`Đơn vị cấp trên với ID: ${dto.parentId} không tồn tại`);
      }
      calculatedPath = `${parent.path}/${dto.code}`;
    }

    return this.prisma.department.create({
      data: {
        code: dto.code,
        name: dto.name,
        level: dto.level,
        levelName: dto.levelName,
        parentId: dto.parentId || null,
        path: calculatedPath,
        operatingMode: dto.operatingMode || OperatingMode.HYBRID,
        managerId: dto.managerId || null,
        description: dto.description || null,
      },
    });
  }

  /**
   * Cập nhật thông tin đơn vị và đồng bộ đường dẫn con cháu nếu thay đổi
   */
  async update(id: string, dto: Partial<UpdateDepartmentDto>) {
    const department = await this.findOne(id);

    let newPath = department.path;
    if (dto.code && dto.code !== department.code) {
      const parts = department.path.split('/');
      parts[parts.length - 1] = dto.code;
      newPath = parts.join('/');
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        name: dto.name,
        level: dto.level,
        levelName: dto.levelName,
        operatingMode: dto.operatingMode,
        managerId: dto.managerId,
        description: dto.description,
        path: newPath,
      },
    });

    // Nếu path thay đổi, cập nhật toàn bộ path của các đơn vị con cháu
    if (newPath !== department.path) {
      const children = await this.prisma.department.findMany({
        where: { path: { startsWith: department.path + '/' } },
      });

      for (const child of children) {
        const updatedChildPath = child.path.replace(department.path, newPath);
        await this.prisma.department.update({
          where: { id: child.id },
          data: { path: updatedChildPath },
        });
      }
    }

    return updated;
  }

  /**
   * Xóa đơn vị (chỉ cho phép nếu không có đơn vị con và không có nhân sự trực thuộc)
   */
  async delete(id: string) {
    const hasChildren = await this.prisma.department.count({ where: { parentId: id } });
    if (hasChildren > 0) {
      throw new BadRequestException('Không thể xóa đơn vị đang có các phòng ban / đơn vị trực thuộc');
    }

    const hasUsers = await this.prisma.user.count({ where: { departmentId: id } });
    if (hasUsers > 0) {
      throw new BadRequestException('Không thể xóa đơn vị đang có cán bộ, nhân sự được phân công');
    }

    await this.prisma.department.delete({ where: { id } });
    return { success: true, message: 'Đã xóa đơn vị thành công' };
  }
}
