import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsOptional, IsEnum, IsNumber, IsArray } from 'class-validator';
import { EmployeeType, ContractType } from '../../../common/enums';

export class ImportUserRowDto {
  @ApiProperty({ example: 1, description: 'Số thứ tự dòng trong file Excel' })
  @IsNumber()
  rowNumber: number;

  @ApiProperty({ example: 'CB-2026-001', required: false })
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @ApiProperty({ example: 'Nguyễn Văn C', description: 'Họ và tên cán bộ' })
  @IsString()
  @IsNotEmpty({ message: 'Họ và tên là bắt buộc' })
  fullName: string;

  @ApiProperty({ example: 'c.nv@kpi.gov.vn', description: 'Địa chỉ Email' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email là bắt buộc' })
  email: string;

  @ApiProperty({ example: 'nguyen.van.c', description: 'Tên đăng nhập' })
  @IsString()
  @IsNotEmpty({ message: 'Tên đăng nhập là bắt buộc' })
  username: string;

  @ApiProperty({ example: '0987654321', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '001090012345', required: false })
  @IsOptional()
  @IsString()
  idCardNumber?: string;

  @ApiProperty({ example: 'PPM-03', description: 'Mã phòng ban / đơn vị trực thuộc' })
  @IsString()
  @IsNotEmpty({ message: 'Mã đơn vị là bắt buộc' })
  departmentCode: string;

  @ApiProperty({ example: 'POS-OFFICER', description: 'Mã vị trí việc làm / chức vụ' })
  @IsString()
  @IsNotEmpty({ message: 'Mã vị trí là bắt buộc' })
  positionCode: string;

  @ApiProperty({ enum: EmployeeType, default: EmployeeType.CONG_CHUC })
  @IsOptional()
  @IsEnum(EmployeeType)
  employeeType?: EmployeeType;

  @ApiProperty({ example: 'Chuyên viên', required: false })
  @IsOptional()
  @IsString()
  cadreRank?: string;

  @ApiProperty({ enum: ContractType, default: ContractType.KHONG_XAC_DINH_THOI_HAN })
  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @ApiProperty({ example: 2.34, required: false })
  @IsOptional()
  @IsNumber()
  salaryCoefficient?: number;
}

export class ImportUsersBatchDto {
  @ApiProperty({ type: [ImportUserRowDto], description: 'Danh sách dòng dữ liệu trích xuất từ Excel' })
  @IsArray()
  rows: ImportUserRowDto[];

  @ApiProperty({ example: true, description: 'Nếu true, chỉ import các dòng hợp lệ và bỏ qua dòng lỗi; nếu false, hủy toàn bộ nếu có bất kỳ lỗi nào' })
  @IsOptional()
  skipErrors?: boolean;
}

export interface RowValidationError {
  rowNumber: number;
  column: string;
  value: any;
  message: string;
}

export interface ImportValidationReport {
  success: boolean;
  totalRows: number;
  validCount: number;
  errorCount: number;
  errors: RowValidationError[];
  importedCount?: number;
}
