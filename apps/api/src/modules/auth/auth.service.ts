import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Kiểm tra thông tin đăng nhập
   */
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        roles: {
          include: { role: true },
        },
        department: true,
        position: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị tạm khóa, vui lòng liên hệ Quản trị viên');
    }

    // Hỗ trợ kiểm tra cả hash bcrypt chuẩn lẫn SHA-256 từ seed
    let isPasswordValid = false;
    if (user.passwordHash.length === 64) {
      // SHA-256 format từ seed
      const hashed = crypto.createHash('sha256').update(pass + 'kpi_salt_2026').digest('hex');
      isPasswordValid = hashed === user.passwordHash;
    } else {
      isPasswordValid = await bcrypt.compare(pass, user.passwordHash);
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    return user;
  }

  /**
   * Xử lý Đăng nhập, cấp cặp Access Token & Refresh Token
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    // Kiểm tra 2FA nếu tài khoản đã kích hoạt
    if (user.isTwoFactorEnabled) {
      if (!loginDto.twoFactorCode) {
        return {
          requireTwoFactor: true,
          message: 'Tài khoản yêu cầu mã xác thực 2 bước (2FA)',
          userId: user.id,
        };
      }

      const isValid = authenticator.verify({
        token: loginDto.twoFactorCode,
        secret: user.twoFactorSecret,
      });

      if (!isValid) {
        throw new UnauthorizedException('Mã xác thực 2FA không chính xác');
      }
    }

    const roles = user.roles.map((r: any) => r.role.code);
    const dataScopes = user.roles.map((r: any) => r.role.dataScope);
    let primaryDataScope = 'SELF_ONLY';
    if (dataScopes.includes('ALL')) primaryDataScope = 'ALL';
    else if (dataScopes.includes('DEPARTMENT_AND_CHILDREN')) primaryDataScope = 'DEPARTMENT_AND_CHILDREN';
    else if (dataScopes.includes('DEPARTMENT_ONLY')) primaryDataScope = 'DEPARTMENT_ONLY';

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles,
      departmentId: user.departmentId,
      dataScope: primaryDataScope,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'kpi_jwt_access_super_secret_key_2026_gov_enterprise_signature_token',
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '1h') as any,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'kpi_jwt_refresh_super_secret_key_2026_gov_enterprise_refresh_token',
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
      },
    );

    // Lưu hash của Refresh Token vào DB
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        departmentId: user.departmentId,
        departmentName: user.department.name,
        departmentPath: user.department.path,
        positionId: user.positionId,
        positionName: user.position.name,
        roles,
        dataScope: primaryDataScope,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
    };
  }

  /**
   * Cấp lại Access Token thông qua Refresh Token hợp lệ
   */
  async refreshToken(refreshTokenStr: string) {
    try {
      const decoded = this.jwtService.verify(refreshTokenStr, {
        secret: process.env.JWT_REFRESH_SECRET || 'kpi_jwt_refresh_super_secret_key_2026_gov_enterprise_refresh_token',
      });

      const tokenHash = crypto.createHash('sha256').update(refreshTokenStr).digest('hex');
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: {
          user: {
            include: {
              roles: { include: { role: true } },
              department: true,
              position: true,
            },
          },
        },
      });

      if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token đã bị hủy hoặc hết hạn');
      }

      const user = storedToken.user;
      const roles = user.roles.map((r: any) => r.role.code);
      const dataScopes = user.roles.map((r: any) => r.role.dataScope);
      let primaryDataScope = 'SELF_ONLY';
      if (dataScopes.includes('ALL')) primaryDataScope = 'ALL';
      else if (dataScopes.includes('DEPARTMENT_AND_CHILDREN')) primaryDataScope = 'DEPARTMENT_AND_CHILDREN';
      else if (dataScopes.includes('DEPARTMENT_ONLY')) primaryDataScope = 'DEPARTMENT_ONLY';

      const payload = {
        sub: user.id,
        username: user.username,
        email: user.email,
        roles,
        departmentId: user.departmentId,
        dataScope: primaryDataScope,
      };

      const newAccessToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_ACCESS_SECRET || 'kpi_jwt_access_super_secret_key_2026_gov_enterprise_signature_token',
        expiresIn: '1h',
      });

      return {
        accessToken: newAccessToken,
        expiresIn: 3600,
      };
    } catch (err) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  /**
   * Đăng xuất và vô hiệu hóa Refresh Token
   */
  async logout(userId: string, refreshTokenStr?: string) {
    if (refreshTokenStr) {
      const tokenHash = crypto.createHash('sha256').update(refreshTokenStr).digest('hex');
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, userId },
        data: { isRevoked: true },
      });
    }
    return { success: true, message: 'Đăng xuất thành công' };
  }

  /**
   * Tạo khóa bí mật và mã QR 2FA
   */
  async generateTwoFactorSecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Không tìm thấy người dùng');

    const secret = authenticator.generateSecret();
    const appName = process.env.TWO_FACTOR_APP_NAME || 'Hệ thống Đánh giá KPI';
    const otpAuthUrl = authenticator.keyuri(user.email, appName, secret);

    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // Lưu tạm thời secret vào user để chờ người dùng nhập mã xác nhận
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return {
      secret,
      qrCode: qrCodeDataUrl,
    };
  }

  /**
   * Xác nhận và kích hoạt 2FA
   */
  async verifyAndEnableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Chưa khởi tạo khóa bảo mật 2FA');
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new BadRequestException('Mã xác thực 2FA không chính xác, vui lòng thử lại');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });

    return { success: true, message: 'Đã kích hoạt bảo mật 2 lớp (2FA) thành công' };
  }

  /**
   * Tắt bảo mật 2 lớp 2FA
   */
  async disableTwoFactor(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: false, twoFactorSecret: null },
    });
    return { success: true, message: 'Đã hủy kích hoạt bảo mật 2FA' };
  }

  /**
   * Yêu cầu khôi phục mật khẩu (Quên mật khẩu)
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Vì lý do bảo mật, không tiết lộ email có tồn tại hay không
      return { success: true, message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token có hạn 1 giờ

    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    this.logger.log(`[PASSWORD_RESET] Token khôi phục mật khẩu cho ${email}: ${rawToken}`);

    return {
      success: true,
      message: 'Hướng dẫn đặt lại mật khẩu đã được xử lý thành công',
      resetToken: process.env.NODE_ENV === 'development' ? rawToken : undefined,
    };
  }

  /**
   * Đặt lại mật khẩu mới với token
   */
  async resetPassword(token: string, newPass: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.isUsed || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Mã khôi phục mật khẩu không hợp lệ hoặc đã hết hạn');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPass, salt);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { isUsed: true },
      }),
    ]);

    return { success: true, message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới.' };
  }
}

