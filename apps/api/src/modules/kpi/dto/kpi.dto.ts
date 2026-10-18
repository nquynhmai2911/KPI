import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  KpiType,
  ScoringMethod,
  TargetDirection,
  KpiAssignmentStatus,
} from '../../../common/enums';

export class FormulaConfigDto {
  @IsOptional()
  @IsArray()
  tiers?: Array<{ min: number; max: number; score: number; label?: string }>;

  @IsOptional()
  @IsNumber()
  bonusPerUnitOver?: number;

  @IsOptional()
  @IsNumber()
  maxBonus?: number;

  @IsOptional()
  @IsNumber()
  penaltyPerUnitUnder?: number;

  @IsOptional()
  @IsNumber()
  maxPenalty?: number;

  @IsOptional()
  @IsNumber()
  passScore?: number;

  @IsOptional()
  @IsNumber()
  failScore?: number;

  @IsOptional()
  @IsBoolean()
  allowOverAchievement?: boolean;

  @IsOptional()
  @IsNumber()
  maxScoreCap?: number;
}

export class CreateKpiLibraryDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã KPI không được để trống' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên chỉ tiêu KPI không được để trống' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Phân loại KPI không được để trống' })
  category: string;

  @IsEnum(KpiType)
  @IsOptional()
  kpiType?: KpiType = KpiType.QUANTITATIVE;

  @IsString()
  @IsNotEmpty({ message: 'Đơn vị tính không được để trống' })
  unit: string;

  @IsEnum(TargetDirection)
  @IsOptional()
  targetDirection?: TargetDirection = TargetDirection.HIGHER_IS_BETTER;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  defaultWeight?: number = 10;

  @IsNumber()
  @IsOptional()
  defaultTarget?: number;

  @IsNumber()
  @IsOptional()
  minThreshold?: number;

  @IsNumber()
  @IsOptional()
  maxThreshold?: number;

  @IsEnum(ScoringMethod)
  @IsOptional()
  scoringMethod?: ScoringMethod = ScoringMethod.LINEAR;

  @IsOptional()
  formulaConfig?: FormulaConfigDto;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  guidance?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;
}

export class UpdateKpiLibraryDto extends CreateKpiLibraryDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class KpiAssignmentItemDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  parentKpiId?: string; // Khóa liên kết cây cascade

  @IsString()
  @IsOptional()
  kpiLibraryId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Mã chỉ tiêu không được để trống' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên chỉ tiêu không được để trống' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(KpiType)
  @IsOptional()
  kpiType?: KpiType = KpiType.QUANTITATIVE;

  @IsString()
  @IsNotEmpty({ message: 'Đơn vị tính không được để trống' })
  unit: string;

  @IsEnum(TargetDirection)
  @IsOptional()
  targetDirection?: TargetDirection = TargetDirection.HIGHER_IS_BETTER;

  @IsNumber()
  @Min(0)
  @Max(100)
  weight: number;

  @IsNumber()
  targetValue: number;

  @IsNumber()
  @IsOptional()
  minThreshold?: number;

  @IsNumber()
  @IsOptional()
  maxThreshold?: number;

  @IsEnum(ScoringMethod)
  @IsOptional()
  scoringMethod?: ScoringMethod = ScoringMethod.LINEAR;

  @IsOptional()
  formulaConfig?: FormulaConfigDto;

  @IsNumber()
  @IsOptional()
  actualValue?: number;

  @IsNumber()
  @IsOptional()
  bonusPoints?: number = 0;

  @IsNumber()
  @IsOptional()
  penaltyPoints?: number = 0;

  @IsNumber()
  @IsOptional()
  sortOrder?: number = 0;
}

export class CreateKpiAssignmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Kỳ đánh giá (periodId) là bắt buộc' })
  periodId: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KpiAssignmentItemDto)
  items: KpiAssignmentItemDto[];
}

export class ReviseKpiAssignmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Lý do điều chỉnh giữa kỳ là bắt buộc theo quy chế kiểm toán' })
  reason: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KpiAssignmentItemDto)
  items: KpiAssignmentItemDto[];
}

export class FeedbackKpiDto {
  @IsString()
  @IsNotEmpty({ message: 'Nội dung phản hồi hoặc lý do từ chối không được để trống' })
  feedbackText: string;
}

export class LockKpiDto {
  @IsString()
  @IsNotEmpty({ message: 'Lý do khóa chỉ tiêu là bắt buộc' })
  reason: string;
}

export class ExcelKpiRowDto {
  rowNumber: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  weight: number;
  targetValue: number;
  minThreshold?: number;
  maxThreshold?: number;
  direction?: string;
  scoringMethod?: string;
  parentKpiCode?: string;
}
