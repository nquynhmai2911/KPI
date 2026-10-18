import { Reflector } from '@nestjs/core';
import { DataScopeGuard } from '../src/common/guards/data-scope.guard';
import { DataScopeType, RoleType } from '../src/common/enums';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('DataScopeGuard Unit Tests (Phân quyền theo Cây đơn vị)', () => {
  let guard: DataScopeGuard;
  let reflector: Reflector;
  let mockPrisma: any;

  beforeEach(() => {
    reflector = new Reflector();
    mockPrisma = {
      department: {
        findUnique: jest.fn(),
      },
    };
    guard = new DataScopeGuard(reflector, mockPrisma);
  });

  const createMockContext = (user: any, params: any = {}, body: any = {}, query: any = {}): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params, body, query }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  };

  it('người dùng có DataScope ALL luôn được phép truy cập', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(DataScopeType.ALL);
    const context = createMockContext({
      id: 'usr-01',
      roles: [RoleType.HR_ADMIN],
      dataScope: DataScopeType.ALL,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('người dùng SELF_ONLY bị từ chối nếu truy cập hồ sơ của người khác', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(DataScopeType.SELF_ONLY);
    const context = createMockContext(
      { id: 'usr-officer-1', dataScope: DataScopeType.SELF_ONLY },
      { userId: 'usr-officer-2' }, // Đang cố truy cập hồ sơ người khác
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('người dùng DEPARTMENT_AND_CHILDREN được phép truy cập đơn vị cấp con theo cây path', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(DataScopeType.DEPARTMENT_AND_CHILDREN);

    // Mock phòng ban cấp trên và cấp con
    mockPrisma.department.findUnique
      .mockResolvedValueOnce({ path: '/BKH-01/KCDS-02/PPM-03' }) // targetDept
      .mockResolvedValueOnce({ path: '/BKH-01/KCDS-02' });        // userDept

    const context = createMockContext(
      { id: 'usr-mgr', departmentId: 'dept-cuc', dataScope: DataScopeType.DEPARTMENT_AND_CHILDREN },
      { departmentId: 'dept-phong' },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('người dùng DEPARTMENT_AND_CHILDREN bị từ chối nếu truy cập đơn vị ngang hàng/ngoài cây quản lý', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(DataScopeType.DEPARTMENT_AND_CHILDREN);

    // Mock phòng ban ở nhánh khác
    mockPrisma.department.findUnique
      .mockResolvedValueOnce({ path: '/BKH-01/KTC-02/PKH-03' }) // targetDept (Khối Tài chính)
      .mockResolvedValueOnce({ path: '/BKH-01/KCDS-02' });        // userDept (Khối Chuyển đổi số)

    const context = createMockContext(
      { id: 'usr-mgr', departmentId: 'dept-cuc-cds', dataScope: DataScopeType.DEPARTMENT_AND_CHILDREN },
      { departmentId: 'dept-phong-tc' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
