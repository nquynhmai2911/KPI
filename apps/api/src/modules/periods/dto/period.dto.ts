import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsDateString, IsOptional, IsObject } from 'class-validator';
import { PeriodType, PeriodStatus, OperatingMode } from '../../../common/enums';

export class CreatePeriodDto {
  @ApiProperty({ example: 'PERIOD-GOV-2026', description: 'Mã kỳ đánh giá duy nhất' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Đánh giá, xếp loại cán bộ công chức năm 2026', description: 'Tên đợt đánh giá' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: PeriodType, default: PeriodType.ANNUAL })
  @IsEnum(PeriodType)
  periodType: PeriodType;

  @ApiProperty({ example: '2026-01-01T00:00:00Z', description: 'Ngày bắt đầu kỳ' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-12-31T23:59:59Z', description: 'Ngày kết thúc kỳ' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: '2026-11-30T23:59:59Z', description: 'Hạn chót hoàn thành chấm điểm' })
  @IsDateString()
  evaluationDeadline: string;

  @ApiProperty({ enum: OperatingMode, default: OperatingMode.GOVERNMENT })
  @IsEnum(OperatingMode)
  operatingMode: OperatingMode;

  @ApiProperty({
    example: { maxExcellentPercentage: 20, quotaPolicy: 'WARNING_WITH_JUSTIFICATION' },
    description: 'Quy tắc nghiệp vụ động lưu dưới dạng JSON',
    required: false,
  })
  @IsOptional()
  @IsObject()
  rulesConfig?: Record<string, any>;

  @ApiProperty({
    example: { SELF: 10, DIRECT_MANAGER: 60, COLLECTIVE_PEER: 30 },
    description: 'Ma trận trọng số người đánh giá',
    required: false,
  })
  @IsOptional()
  @IsObject()
  weightMatrix?: Record<string, any>;
}

export class LockPeriodDto {
  @ApiProperty({ example: 'Đã hoàn thành phê duyệt xếp loại toàn cơ quan và niêm yết công khai', description: 'Lý do khóa kỳ' })
  @IsString()
  @IsNotEmpty({ message: 'Lý do khóa kỳ là bắt buộc' })
  reason: string;
}

export class UnlockPeriodDto {
  @ApiProperty({
    example: 'Mở khóa theo Công văn số 123/TCCB để điều chỉnh bổ sung minh chứng khen thưởng đột xuất',
    description: 'Lý do mở khóa bắt buộc (có tính pháp lý/kiểm toán)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Lý do mở khóa kỳ đánh giá là bắt buộc' })
  reason: string;
}
