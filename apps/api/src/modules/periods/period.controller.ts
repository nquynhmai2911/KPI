import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PeriodService } from './period.service';
import { CreatePeriodDto, LockPeriodDto, UnlockPeriodDto } from './dto/period.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleType } from '../../common/enums';

@ApiTags('Kỳ Đánh giá & Quản lý Khóa kỳ (Assessment Periods)')
@Controller('periods')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class PeriodController {
  constructor(private readonly periodService: PeriodService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các kỳ đánh giá' })
  async findAll() {
    return this.periodService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết kỳ đánh giá kèm lịch sử khóa/mở khóa' })
  async findOne(@Param('id') id: string) {
    return this.periodService.findOne(id);
  }

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.HR_ADMIN)
  @ApiOperation({ summary: 'Tạo mới kỳ đánh giá (Chỉ Quản trị viên)' })
  async create(@Body() dto: CreatePeriodDto) {
    return this.periodService.create(dto);
  }

  @Post(':id/lock')
  @Roles(RoleType.SUPER_ADMIN, RoleType.HR_ADMIN, RoleType.HEAD_OF_AGENCY)
  @ApiOperation({ summary: 'Khóa kỳ đánh giá (Đóng băng dữ liệu, bất biến)' })
  async lock(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
    @Body() dto: LockPeriodDto,
  ) {
    return this.periodService.lockPeriod(id, currentUser, dto);
  }

  @Post(':id/unlock')
  @Roles(RoleType.SUPER_ADMIN, RoleType.HEAD_OF_AGENCY, RoleType.HR_ADMIN)
  @ApiOperation({ summary: 'Mở khóa đặc biệt kỳ đánh giá (Bắt buộc nhập lý do có căn cứ)' })
  async unlock(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
    @Body() dto: UnlockPeriodDto,
  ) {
    return this.periodService.unlockPeriod(id, currentUser, dto);
  }
}
