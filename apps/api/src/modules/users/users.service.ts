import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { DataScopeType, RoleType } from '../../common/enums';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy danh sách cán bộ, nhân sự theo phạm vi Data Scope
   */
  async findAll(query: {
    currentUser: any;
    departmentId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { currentUser, departmentId, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. Áp dụng Data Scope kiểm soát quyền xem dữ liệu
    if (currentUser.dataScope === DataScopeType.SELF_ONLY) {
      where.id = currentUser.id;
    } else if (currentUser.dataScope === DataScopeType.DEPARTMENT_ONLY) {
      where.departmentId = currentUser.departmentId;
    } else if (currentUser.dataScope === DataScopeType.DEPARTMENT_AND_CHILDREN) {
      where.department = {
        path: { startsWith: currentUser.departmentPath },
      };
    }

    // 2. Bộ lọc theo phòng ban cụ thể nếu truyền vào
    if (departmentId) {
      where.departmentId = departmentId;
    }

    // 3. Tìm kiếm theo tên hoặc username
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { fullName: 'asc' },
        include: {
          department: true,
          position: true,
          roles: { include: { role: true } },
        },
      }),
    ]);

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      data: users.map((u) => {
        const { passwordHash, twoFactorSecret, ...safeUser } = u;
        return safeUser;
      }),
    };
  }

  /**
   * Tìm người dùng theo ID
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
        position: true,
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }

    const { passwordHash, twoFactorSecret, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Tạo tài khoản mới kèm phân quyền Roles
   */
  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
      },
    });

    if (existing) {
      throw new BadRequestException('Tên đăng nhập hoặc Email đã tồn tại trong hệ thống');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Tìm các role theo RoleType
    const roles = await this.prisma.role.findMany({
      where: { code: { in: dto.roles } },
    });

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          fullName: dto.fullName,
          passwordHash,
          phone: dto.phone || null,
          departmentId: dto.departmentId,
          positionId: dto.positionId,
        },
      });

      if (roles.length > 0) {
        await tx.userRole.createMany({
          data: roles.map((r) => ({
            userId: user.id,
            roleId: r.id,
          })),
        });
      }

      // Cập nhật headcount phòng ban
      await tx.department.update({
        where: { id: dto.departmentId },
        data: { headcount: { increment: 1 } },
      });

      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    });
  }

  /**
   * Cập nhật thông tin cán bộ
   */
  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // Cập nhật roles nếu có
      if (dto.roles && dto.roles.length > 0) {
        const roles = await tx.role.findMany({
          where: { code: { in: dto.roles } },
        });

        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({
          data: roles.map((r) => ({ userId: id, roleId: r.id })),
        });
      }

      const updated = await tx.user.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          departmentId: dto.departmentId,
          positionId: dto.positionId,
          isActive: dto.isActive,
        },
        include: {
          department: true,
          position: true,
          roles: { include: { role: true } },
        },
      });

      const { passwordHash, twoFactorSecret, ...safeUser } = updated;
      return safeUser;
    });
  }

  /**
   * Import nhân sự hàng loạt từ dữ liệu Excel với báo cáo lỗi chi tiết từng dòng
   */
  async importUsersBatch(dto: { rows: any[]; skipErrors?: boolean }) {
    const { rows, skipErrors = false } = dto;
    const errors: Array<{ rowNumber: number; column: string; value: any; message: string }> = [];
    const validRows: any[] = [];

    // 1. Tải trước dữ liệu tham chiếu để kiểm tra tính toàn vẹn
    const [departments, positions, existingUsers] = await Promise.all([
      this.prisma.department.findMany({ select: { id: true, code: true } }),
      this.prisma.position.findMany({ select: { id: true, code: true } }),
      this.prisma.user.findMany({ select: { username: true, email: true, employeeCode: true } }),
    ]);

    const deptMap = new Map(departments.map((d) => [d.code.toUpperCase(), d.id]));
    const posMap = new Map(positions.map((p) => [p.code.toUpperCase(), p.id]));

    const existingUsernames = new Set(existingUsers.map((u) => u.username.toLowerCase()));
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));
    const existingCodes = new Set(
      existingUsers.filter((u) => u.employeeCode).map((u) => u.employeeCode!.toUpperCase()),
    );

    // Tập hợp theo dõi trùng lặp nội bộ trong chính file import
    const batchUsernames = new Set<string>();
    const batchEmails = new Set<string>();
    const batchCodes = new Set<string>();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 2. Kiểm tra từng dòng một cách nghiêm ngặt
    for (const row of rows) {
      let isRowValid = true;
      const rowNum = row.rowNumber || rows.indexOf(row) + 1;

      // Kiểm tra Họ tên
      if (!row.fullName || row.fullName.trim() === '') {
        errors.push({ rowNumber: rowNum, column: 'fullName', value: row.fullName, message: 'Họ và tên không được để trống' });
        isRowValid = false;
      }

      // Kiểm tra Username
      if (!row.username || row.username.trim() === '') {
        errors.push({ rowNumber: rowNum, column: 'username', value: row.username, message: 'Tên đăng nhập không được để trống' });
        isRowValid = false;
      } else {
        const uLower = row.username.trim().toLowerCase();
        if (existingUsernames.has(uLower)) {
          errors.push({ rowNumber: rowNum, column: 'username', value: row.username, message: `Tên đăng nhập '${row.username}' đã tồn tại trong hệ thống` });
          isRowValid = false;
        } else if (batchUsernames.has(uLower)) {
          errors.push({ rowNumber: rowNum, column: 'username', value: row.username, message: `Tên đăng nhập '${row.username}' bị trùng lặp trong chính file import` });
          isRowValid = false;
        } else {
          batchUsernames.add(uLower);
        }
      }

      // Kiểm tra Email
      if (!row.email || row.email.trim() === '') {
        errors.push({ rowNumber: rowNum, column: 'email', value: row.email, message: 'Email không được để trống' });
        isRowValid = false;
      } else if (!emailRegex.test(row.email.trim())) {
        errors.push({ rowNumber: rowNum, column: 'email', value: row.email, message: 'Định dạng email không hợp lệ' });
        isRowValid = false;
      } else {
        const eLower = row.email.trim().toLowerCase();
        if (existingEmails.has(eLower)) {
          errors.push({ rowNumber: rowNum, column: 'email', value: row.email, message: `Email '${row.email}' đã được đăng ký cho cán bộ khác` });
          isRowValid = false;
        } else if (batchEmails.has(eLower)) {
          errors.push({ rowNumber: rowNum, column: 'email', value: row.email, message: `Email '${row.email}' bị trùng lặp trong file import` });
          isRowValid = false;
        } else {
          batchEmails.add(eLower);
        }
      }

      // Kiểm tra Mã nhân viên (nếu có)
      if (row.employeeCode && row.employeeCode.trim() !== '') {
        const cUpper = row.employeeCode.trim().toUpperCase();
        if (existingCodes.has(cUpper) || batchCodes.has(cUpper)) {
          errors.push({ rowNumber: rowNum, column: 'employeeCode', value: row.employeeCode, message: `Mã cán bộ '${row.employeeCode}' đã tồn tại` });
          isRowValid = false;
        } else {
          batchCodes.add(cUpper);
        }
      }

      // Kiểm tra Mã Đơn vị
      if (!row.departmentCode || row.departmentCode.trim() === '') {
        errors.push({ rowNumber: rowNum, column: 'departmentCode', value: row.departmentCode, message: 'Mã phòng ban/đơn vị không được để trống' });
        isRowValid = false;
      } else if (!deptMap.has(row.departmentCode.trim().toUpperCase())) {
        errors.push({ rowNumber: rowNum, column: 'departmentCode', value: row.departmentCode, message: `Mã đơn vị '${row.departmentCode}' không tồn tại trên hệ thống cây tổ chức` });
        isRowValid = false;
      }

      // Kiểm tra Mã Chức vụ / Vị trí việc làm
      if (!row.positionCode || row.positionCode.trim() === '') {
        errors.push({ rowNumber: rowNum, column: 'positionCode', value: row.positionCode, message: 'Mã chức vụ/vị trí không được để trống' });
        isRowValid = false;
      } else if (!posMap.has(row.positionCode.trim().toUpperCase())) {
        errors.push({ rowNumber: rowNum, column: 'positionCode', value: row.positionCode, message: `Mã vị trí việc làm '${row.positionCode}' không tồn tại trên danh mục` });
        isRowValid = false;
      }

      if (isRowValid) {
        validRows.push({
          ...row,
          resolvedDepartmentId: deptMap.get(row.departmentCode.trim().toUpperCase()),
          resolvedPositionId: posMap.get(row.positionCode.trim().toUpperCase()),
        });
      }
    }

    // 3. Xử lý lưu dữ liệu nếu thỏa mãn điều kiện
    let importedCount = 0;
    if (validRows.length > 0 && (skipErrors || errors.length === 0)) {
      const salt = await bcrypt.genSalt(10);
      const defaultPasswordHash = await bcrypt.hash('MatKhau@2026!', salt);

      // Tìm role EMPLOYEE mặc định
      const empRole = await this.prisma.role.findFirst({ where: { code: 'EMPLOYEE' as any } });

      await this.prisma.$transaction(async (tx) => {
        for (const item of validRows) {
          const user = await tx.user.create({
            data: {
              employeeCode: item.employeeCode || null,
              username: item.username.trim(),
              email: item.email.trim(),
              fullName: item.fullName.trim(),
              passwordHash: defaultPasswordHash,
              phone: item.phone || null,
              idCardNumber: item.idCardNumber || null,
              departmentId: item.resolvedDepartmentId,
              positionId: item.resolvedPositionId,
              employeeType: item.employeeType || ('CONG_CHUC' as any),
              cadreRank: item.cadreRank || 'Chuyên viên',
              contractType: item.contractType || ('KHONG_XAC_DINH_THOI_HAN' as any),
              salaryCoefficient: Number(item.salaryCoefficient) || 2.34,
            },
          });

          if (empRole) {
            await tx.userRole.create({
              data: { userId: user.id, roleId: empRole.id },
            });
          }

          importedCount++;
        }
      });
    }

    return {
      success: errors.length === 0 || (skipErrors && importedCount > 0),
      totalRows: rows.length,
      validCount: validRows.length,
      errorCount: errors.length,
      importedCount,
      errors,
    };
  }
}
