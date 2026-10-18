import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType, OperatingMode, AuditAction } from '../../common/enums';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Cơ cấu Tổ chức & Cây Đơn vị (Departments)')
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class DepartmentController {
  constructor(private readonly deptService: DepartmentService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Lấy cấu trúc Cây đơn vị phân cấp đầy đủ (Org Tree)' })
  @ApiQuery({ name: 'operatingMode', enum: OperatingMode, required: false })
  async getTree(@Query('operatingMode') mode?: OperatingMode) {
    return this.deptService.getDepartmentTree(mode);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách phẳng tất cả phòng ban, đơn vị' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'operatingMode', enum: OperatingMode, required: false })
  async findAll(@Query('search') search?: string, @Query('operatingMode') mode?: OperatingMode) {
    return this.deptService.findAll({ search, operatingMode: mode });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết thông tin một đơn vị kèm danh sách cán bộ trực thuộc' })
  async findOne(@Param('id') id: string) {
    return this.deptService.findOne(id);
  }

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.HR_ADMIN)
  @Audit({ action: AuditAction.CREATE, entityName: 'Department' })
  @ApiOperation({ summary: 'Thêm mới đơn vị vào cây tổ chức (Yêu cầu Admin)' })
  async create(@Body() dto: CreateDepartmentDto) {
    return this.deptService.create(dto);
  }

  @Put(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.HR_ADMIN)
  @Audit({ action: AuditAction.UPDATE, entityName: 'Department' })
  @ApiOperation({ summary: 'Cập nhật thông tin đơn vị (Yêu cầu Admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.deptService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleType.SUPER_ADMIN)
  @Audit({ action: AuditAction.DELETE, entityName: 'Department' })
  @ApiOperation({ summary: 'Xóa đơn vị khỏi hệ thống (Chỉ Super Admin)' })
  async delete(@Param('id') id: string) {
    return this.deptService.delete(id);
  }
}
