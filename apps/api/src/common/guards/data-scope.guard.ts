import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataScopeType, RoleType } from '../enums';
import { DATA_SCOPE_KEY } from '../decorators/data-scope.decorator';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class DataScopeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredScope = this.reflector.getAllAndOverride<DataScopeType>(DATA_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Không tìm thấy thông tin định danh người dùng');
    }

    // Super Admin hoặc Lãnh đạo cấp cao toàn quyền
    if (user.roles?.includes(RoleType.SUPER_ADMIN) || user.dataScope === DataScopeType.ALL) {
      return true;
    }

    // Xác định target department và target user từ request params / query / body
    const targetDepartmentId = request.params?.departmentId || request.body?.departmentId || request.query?.departmentId;
    const targetUserId = request.params?.userId || request.body?.userId || request.query?.userId;

    // Kiểm tra phạm vi SELF_ONLY
    if (user.dataScope === DataScopeType.SELF_ONLY) {
      if (targetUserId && targetUserId !== user.id) {
        throw new ForbiddenException('Phạm vi quyền của bạn chỉ được phép thao tác với dữ liệu của chính mình');
      }
      return true;
    }

    // Kiểm tra phạm vi DEPARTMENT_ONLY
    if (user.dataScope === DataScopeType.DEPARTMENT_ONLY) {
      if (targetDepartmentId && targetDepartmentId !== user.departmentId) {
        throw new ForbiddenException('Bạn chỉ có quyền truy cập dữ liệu trong nội bộ phòng ban của mình');
      }
      return true;
    }

    // Kiểm tra phạm vi DEPARTMENT_AND_CHILDREN theo cây tổ chức (Path-based hierarchy)
    if (user.dataScope === DataScopeType.DEPARTMENT_AND_CHILDREN) {
      if (!targetDepartmentId) {
        return true;
      }

      if (targetDepartmentId === user.departmentId) {
        return true;
      }

      // Truy vấn đường dẫn path của đơn vị mục tiêu để so khớp cây phân cấp
      const targetDept = await this.prisma.department.findUnique({
        where: { id: targetDepartmentId },
        select: { path: true },
      });

      const userDept = await this.prisma.department.findUnique({
        where: { id: user.departmentId },
        select: { path: true },
      });

      if (!targetDept || !userDept) {
        throw new ForbiddenException('Không tìm thấy thông tin đơn vị tổ chức trong hệ thống');
      }

      // Đơn vị con phải có path bắt đầu bằng path của đơn vị cha
      const isDescendant = targetDept.path.startsWith(userDept.path);
      if (!isDescendant) {
        throw new ForbiddenException('Đơn vị mục tiêu không thuộc phạm vi quản lý trực thuộc của bạn');
      }

      return true;
    }

    return true;
  }
}
