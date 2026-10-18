import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsOptional, IsArray, IsEnum, MinLength } from 'class-validator';
import { RoleType } from '../../../common/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'nguyen.van.b', description: 'Tên đăng nhập hệ thống' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'b.nv@kpi.gov.vn', description: 'Địa chỉ Email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MatKhau@2026!', description: 'Mật khẩu khởi tạo' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn B', description: 'Họ và tên cán bộ/nhân viên' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '0912345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'dept-id-uuid', description: 'ID đơn vị phòng ban trực thuộc' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({ example: 'pos-id-uuid', description: 'ID chức vụ / vị trí việc làm' })
  @IsString()
  @IsNotEmpty()
  positionId: string;

  @ApiProperty({ enum: RoleType, isArray: true, example: [RoleType.EMPLOYEE] })
  @IsArray()
  @IsEnum(RoleType, { each: true })
  roles: RoleType[];
}

export class UpdateUserDto {
  @ApiProperty({ example: 'Nguyễn Văn B', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: '0912345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'dept-id-uuid', required: false })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({ example: 'pos-id-uuid', required: false })
  @IsOptional()
  @IsString()
  positionId?: string;

  @ApiProperty({ enum: RoleType, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(RoleType, { each: true })
  roles?: RoleType[];

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isActive?: boolean;
}
