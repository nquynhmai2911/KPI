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
  Request,
} from '@nestjs/common';
import { KpiService } from './kpi.service';
import { KpiScoringService } from './kpi-scoring.service';
import {
  CreateKpiLibraryDto,
  UpdateKpiLibraryDto,
  CreateKpiAssignmentDto,
  ReviseKpiAssignmentDto,
  FeedbackKpiDto,
  LockKpiDto,
  ExcelKpiRowDto,
} from './dto/kpi.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/enums';

@Controller('kpi')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KpiController {
  constructor(
    private readonly kpiService: KpiService,
    private readonly scoringService: KpiScoringService,
  ) {}

  // ----------------------------------------------------------------------------
  // THƯ VIỆN KPI (KPI LIBRARY)
  // ----------------------------------------------------------------------------

  @Get('library')
  async getLibrary(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.kpiService.findAllLibrary({ category, search, departmentId });
  }

  @Post('library')
  @Roles(RoleType.SUPER_ADMIN, RoleType.HR_ADMIN)
  async createLibraryItem(@Body() dto: CreateKpiLibraryDto) {
    return this.kpiService.createLibraryItem(dto);
  }

  @Put('library/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.HR_ADMIN)
  async updateLibraryItem(@Param('id') id: string, @Body() dto: UpdateKpiLibraryDto) {
    return this.kpiService.updateLibraryItem(id, dto);
  }

  @Delete('library/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.HR_ADMIN)
  async deleteLibraryItem(@Param('id') id: string) {
    return this.kpiService.deleteLibraryItem(id);
  }

  // ----------------------------------------------------------------------------
  // BẢNG GIAO KPI & QUY TRÌNH DUYỆT (ASSIGNMENTS & WORKFLOW)
  // ----------------------------------------------------------------------------

  @Get('assignments')
  async getAssignments(
    @Query('periodId') periodId: string,
    @Query('departmentId') departmentId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: any,
  ) {
    return this.kpiService.findAssignments({
      periodId,
      departmentId,
      userId,
      status,
    });
  }

  @Get('assignments/:id')
  async getAssignmentById(@Param('id') id: string) {
    return this.kpiService.getAssignmentById(id);
  }

  @Post('assignments')
  @Roles(RoleType.SUPER_ADMIN, RoleType.HR_ADMIN, RoleType.DEPT_HEAD, RoleType.HEAD_OF_AGENCY)
  async createOrUpdateAssignment(@Body() dto: CreateKpiAssignmentDto, @Request() req: any) {
    const creatorId = req.user?.id || 'admin-usr';
    return this.kpiService.createOrUpdateAssignment(dto, creatorId);
  }

  @Post('assignments/:id/assign')
  @Roles(RoleType.SUPER_ADMIN, RoleType.HR_ADMIN, RoleType.DEPT_HEAD, RoleType.HEAD_OF_AGENCY)
  async assignKpi(@Param('id') id: string, @Request() req: any) {
    const assignedById = req.user?.id || 'admin-usr';
    return this.kpiService.assignKpi(id, assignedById);
  }

  @Post('assignments/:id/accept')
  async acceptKpi(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || 'emp-usr';
    return this.kpiService.acceptKpi(id, userId);
  }

  @Post('assignments/:id/feedback')
  async requestFeedback(
    @Param('id') id: string,
    @Body() dto: FeedbackKpiDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'emp-usr';
    return this.kpiService.requestFeedback(id, userId, dto);
  }

  @Post('assignments/:id/approve')
  @Roles(RoleType.SUPER_ADMIN, RoleType.HR_ADMIN, RoleType.DEPT_HEAD, RoleType.HEAD_OF_AGENCY)
  async approveKpi(@Param('id') id: string, @Request() req: any) {
    const managerId = req.user?.id || 'manager-usr';
    return this.kpiService.approveKpi(id, managerId);
  }

  @Post('assignments/:id/lock')
  @Roles(RoleType.SUPER_ADMIN, RoleType.HR_ADMIN, RoleType.HEAD_OF_AGENCY)
  async lockKpi(
    @Param('id') id: string,
    @Body() dto: LockKpiDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'admin-usr';
    return this.kpiService.lockKpi(id, userId, dto);
  }

  @Post('assignments/:id/revise')
  @Roles(RoleType.SUPER_ADMIN, RoleType.HR_ADMIN, RoleType.DEPT_HEAD, RoleType.HEAD_OF_AGENCY)
  async reviseKpi(
    @Param('id') id: string,
    @Body() dto: ReviseKpiAssignmentDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'manager-usr';
    return this.kpiService.reviseKpi(id, userId, dto);
  }

  // ----------------------------------------------------------------------------
  // CÂY CASCADE MỤC TIÊU (CASCADE TREE)
  // ----------------------------------------------------------------------------

  @Get('cascade-tree')
  async getCascadeTree(@Query('periodId') periodId: string) {
    return this.kpiService.getCascadeTree(periodId);
  }

  // ----------------------------------------------------------------------------
  // KIỂM TRA TRỌNG SỐ & IMPORT EXCEL (VALIDATIONS)
  // ----------------------------------------------------------------------------

  @Post('validate-weight')
  async validateWeight(@Body('items') items: Array<{ weight?: number }>) {
    return this.scoringService.validateTotalWeight(items);
  }

  @Post('import-excel')
  @Roles(RoleType.SUPER_ADMIN, RoleType.HR_ADMIN, RoleType.DEPT_HEAD)
  async importExcel(@Body('rows') rows: ExcelKpiRowDto[]) {
    return this.kpiService.importKpiExcel(rows);
  }
}
