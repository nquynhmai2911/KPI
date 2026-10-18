import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'kpi_jwt_access_super_secret_key_2026_gov_enterprise_signature_token',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        department: true,
        position: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa');
    }

    // Xác định quyền data scope cao nhất của người dùng
    const roles = user.roles.map((r) => r.role.code);
    const dataScopes = user.roles.map((r) => r.role.dataScope);

    // Thứ tự ưu tiên: ALL > DEPARTMENT_AND_CHILDREN > DEPARTMENT_ONLY > SELF_ONLY
    let primaryDataScope = 'SELF_ONLY';
    if (dataScopes.includes('ALL')) {
      primaryDataScope = 'ALL';
    } else if (dataScopes.includes('DEPARTMENT_AND_CHILDREN')) {
      primaryDataScope = 'DEPARTMENT_AND_CHILDREN';
    } else if (dataScopes.includes('DEPARTMENT_ONLY')) {
      primaryDataScope = 'DEPARTMENT_ONLY';
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      departmentId: user.departmentId,
      departmentCode: user.department.code,
      departmentName: user.department.name,
      departmentPath: user.department.path,
      positionId: user.positionId,
      positionName: user.position.name,
      isLeadership: user.position.isLeadership,
      roles,
      dataScope: primaryDataScope,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    };
  }
}
