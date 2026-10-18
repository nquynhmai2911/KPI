import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { RoleType, AuditAction } from '../../common/enums';

@ApiTags('Quản lý Cán bộ & Người dùng (Users)')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách cán bộ theo phạm vi phân quyền Data Scope' })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentUser() currentUser: any,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.findAll({ currentUser, departmentId, search, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết thông tin hồ sơ cán bộ' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.HR_ADMIN)
  @Audit({ action: AuditAction.CREATE, entityName: 'User' })
  @ApiOperation({ summary: 'Tạo mới hồ sơ tài khoản cán bộ/nhân viên (Chỉ Admin)' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.HR_ADMIN)
  @Audit({ action: AuditAction.UPDATE, entityName: 'User' })
  @ApiOperation({ summary: 'Cập nhật thông tin cán bộ (Chỉ Admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Post('batch/import-excel')
  @Roles(RoleType.SUPER_ADMIN, RoleType.HR_ADMIN)
  @Audit({ action: AuditAction.IMPORT_EXCEL, entityName: 'User' })
  @ApiOperation({ summary: 'Import danh sách nhân sự từ file Excel kèm báo cáo lỗi chi tiết từng dòng' })
  async importExcel(@Body() batchDto: { rows: any[]; skipErrors?: boolean }) {
    return this.usersService.importUsersBatch(batchDto);
  }
}
