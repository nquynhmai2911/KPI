import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { RoleType } from '../src/common/enums';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('RolesGuard Unit Tests', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  };

  it('nên cho phép truy cập nếu endpoint không yêu cầu vai trò nào (public endpoint)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = createMockContext({ roles: [RoleType.EMPLOYEE] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('SUPER_ADMIN luôn được phép truy cập mọi endpoint dù yêu cầu bất kỳ role nào', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleType.HEAD_OF_AGENCY]);
    const context = createMockContext({
      roles: [RoleType.SUPER_ADMIN],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('cho phép người dùng có đúng vai trò yêu cầu được truy cập', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleType.DEPT_HEAD, RoleType.HR_ADMIN]);
    const context = createMockContext({
      roles: [RoleType.DEPT_HEAD],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('từ chối và ném ForbiddenException nếu người dùng không có vai trò hợp lệ', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleType.HEAD_OF_AGENCY]);
    const context = createMockContext({
      roles: [RoleType.EMPLOYEE],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
