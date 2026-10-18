import { AuthService } from '../src/modules/auth/auth.service';
import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('AuthService Unit Tests', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockJwtService: any;

  const validPassword = 'MatKhau@2026!';
  const hashedPassword = crypto.createHash('sha256').update(validPassword + 'kpi_salt_2026').digest('hex');

  const mockUser = {
    id: 'usr-01',
    username: 'lanhdao.an',
    email: 'lanhdao.an@kpi.gov.vn',
    fullName: 'Nguyễn Văn An',
    passwordHash: hashedPassword,
    isActive: true,
    isTwoFactorEnabled: false,
    departmentId: 'dept-01',
    department: { name: 'Cơ quan Bộ', path: '/BKH-01' },
    position: { name: 'Thứ trưởng' },
    roles: [{ role: { code: 'HEAD_OF_AGENCY', dataScope: 'ALL' } }],
  };

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock_jwt_token_2026'),
      verify: jest.fn(),
    };

    service = new AuthService(mockPrisma, mockJwtService);
  });

  it('xác thực thành công với tên đăng nhập và mật khẩu chính xác', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const user = await service.validateUser('lanhdao.an', validPassword);
    expect(user).toBeDefined();
    expect(user.id).toBe('usr-01');
    expect(user.username).toBe('lanhdao.an');
  });

  it('từ chối và ném UnauthorizedException khi nhập sai mật khẩu', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(service.validateUser('lanhdao.an', 'SaiMatKhau123!')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('từ chối tài khoản khi người dùng bị vô hiệu hóa (isActive = false)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      isActive: false,
    });

    await expect(service.validateUser('lanhdao.an', validPassword)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('login thành công trả về cả Access Token và Refresh Token', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.refreshToken.create.mockResolvedValue({ id: 'token-uuid' });

    const result = await service.login({
      username: 'lanhdao.an',
      password: validPassword,
    });

    expect(result.accessToken).toBe('mock_jwt_token_2026');
    expect(result.refreshToken).toBe('mock_jwt_token_2026');
    expect(result.user.username).toBe('lanhdao.an');
    expect(result.user.roles).toContain('HEAD_OF_AGENCY');
  });
});
