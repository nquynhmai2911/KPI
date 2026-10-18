import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { OperatingMode } from '../../../common/enums';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'KCDS-02', description: 'Mã định danh đơn vị (viết hoa, không dấu)' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Cục Chuyển đổi số & Tác nghiệp CNTT', description: 'Tên đầy đủ của đơn vị' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 2, description: 'Cấp bậc phân cấp (1: Bộ/Tập đoàn, 2: Cục/Khối, 3: Vụ/Phòng)' })
  @IsInt()
  @Min(1)
  level: number;

  @ApiProperty({ example: 'Cục / Khối Nghiệp vụ', required: false })
  @IsOptional()
  @IsString()
  levelName?: string;

  @ApiProperty({ example: 'dept-root-id', description: 'ID của đơn vị cấp trên', required: false })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ enum: OperatingMode, default: OperatingMode.HYBRID })
  @IsOptional()
  @IsEnum(OperatingMode)
  operatingMode?: OperatingMode;

  @ApiProperty({ example: 'usr-manager-id', required: false })
  @IsOptional()
  @IsString()
  managerId?: string;

  @ApiProperty({ example: 'Chịu trách nhiệm kiến tạo hạ tầng số...', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateDepartmentDto extends CreateDepartmentDto {}
