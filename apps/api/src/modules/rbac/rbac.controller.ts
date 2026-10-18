import { Controller, Get, Put, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/enums';

@ApiTags('Quản trị Phân quyền RBAC & Ma trận Quyền (RBAC Matrix)')
@Controller('rbac')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('permissions')
  @ApiOperation({ summary: 'Lấy danh mục tất cả Permission (resource:action)' })
  getAllPermissions() {
    return this.rbacService.getAllPermissions();
  }

  @Get('matrix')
  @ApiOperation({ summary: 'Lấy ma trận quyền đầy đủ (Role x Permission)' })
  getMatrix() {
    return {
      permissions: this.rbacService.getAllPermissions(),
      roles: this.rbacService.getAllRoles(),
    };
  }

  @Put('roles/:roleCode/permissions')
  @Roles(RoleType.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Admin cập nhật quyền hạn cho vai trò' })
  updateRolePermissions(
    @Param('roleCode') roleCode: string,
    @Body() body: { permissions: string[] }
  ) {
    return this.rbacService.updateRolePermissions(roleCode, body.permissions);
  }

  @Post('roles/clone')
  @Roles(RoleType.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Admin sao chép một vai trò mới từ vai trò gốc' })
  cloneRole(
    @Body()
    body: {
      sourceRoleCode: string;
      newRoleCode: string;
      newRoleName: string;
      description?: string;
    }
  ) {
    return this.rbacService.cloneRole(
      body.sourceRoleCode,
      body.newRoleCode,
      body.newRoleName,
      body.description
    );
  }

  @Patch('roles/:roleCode/toggle')
  @Roles(RoleType.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Bật/tắt kích hoạt vai trò theo đặc thù tổ chức' })
  toggleRoleActive(
    @Param('roleCode') roleCode: string,
    @Body() body: { isActive: boolean }
  ) {
    return this.rbacService.toggleRoleActive(roleCode, body.isActive);
  }
}
